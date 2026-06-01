"""
collect_cldf.py — ETL da Câmara Legislativa do Distrito Federal (CLDF)

API: https://dados.cl.df.gov.br/api/3/action (CKAN padrão)
Portal: https://dados.cl.df.gov.br/
Dados: datasets CSV/JSON via CKAN — presença, votações, despesas, proposições

Estratégia CKAN:
  1. package_search → encontrar datasets relevantes
  2. resource_show  → obter URL do recurso (CSV ou JSON)
  3. Download e parse do recurso

Uso:
    python -m etl.ale.collect_cldf
    python -m etl.ale.collect_cldf --entidade presencas --ano 2025
"""

import argparse
import csv
import io
import logging
import time
from datetime import date
from typing import Optional

import requests

from .base import (
    get_db, get_json,
    buscar_mapa_deputados_uf, buscar_politico_por_nome,
    normalizar_voto, normalizar_justificativa, parse_data,
    registrar_coleta
)

log = logging.getLogger(__name__)

CKAN_BASE = 'https://dados.cl.df.gov.br/api/3/action'
FONTE = 'cldf'
UF = 'DF'
ANO_ATUAL = date.today().year
ANOS_PADRAO = [ANO_ATUAL - 1, ANO_ATUAL]

# IDs/slugs exatos dos datasets CLDF no CKAN (confirmados via package_list)
DATASETS_CLDF = {
    'despesas':    ['verbas-indenizatorias'],
    'deputados':   ['relacao-nominal-de-deputados-e-servidores'],
    'proposicoes': ['proposicoes'],
    # presenças e votações não existem como dataset público no CLDF CKAN
    'presencas':   [],
    'votacoes':    [],
}

# Palavras-chave como fallback se slug não funcionar
QUERIES_CKAN = {
    'despesas':    ['verbas indenizatorias'],
    'proposicoes': ['proposicoes'],
    'presencas':   [],
    'votacoes':    [],
}


# ──────────────────────────────────────────────────────────────────────────────
# CKAN helpers
# ──────────────────────────────────────────────────────────────────────────────

def ckan_search(query: str, rows: int = 20) -> list[dict]:
    """Retorna lista de packages (datasets) que batem com a query."""
    dados = get_json(f'{CKAN_BASE}/package_search',
                     params={'q': query, 'rows': rows})
    if not dados or not dados.get('success'):
        return []
    return dados.get('result', {}).get('results', [])


def ckan_resource_url(resource_id: str) -> Optional[str]:
    """Retorna URL de download de um resource."""
    dados = get_json(f'{CKAN_BASE}/resource_show', params={'id': resource_id})
    if not dados or not dados.get('success'):
        return None
    return dados.get('result', {}).get('url')


def baixar_tabela(url: str, fmt: str = '') -> Optional[list[dict]]:
    """Baixa CSV ou XLSX de uma URL e retorna lista de dicts. Segue redirects."""
    try:
        r = requests.get(url, timeout=120, allow_redirects=True,
                         headers={'User-Agent': 'MeusPoliticosBR/1.0'})
        r.raise_for_status()

        content_type = r.headers.get('content-type', '').lower()
        is_xlsx = fmt.lower() in ('xlsx', 'xls') or 'spreadsheet' in content_type or 'excel' in content_type

        if is_xlsx:
            try:
                import openpyxl
                wb = openpyxl.load_workbook(io.BytesIO(r.content), read_only=True, data_only=True)
                ws = wb.active
                rows = list(ws.iter_rows(values_only=True))
                if not rows:
                    return None
                headers = [str(c or '').strip() for c in rows[0]]
                return [dict(zip(headers, [str(v or '').strip() for v in row])) for row in rows[1:] if any(v for v in row)]
            except Exception as e:
                log.warning(f"[CLDF] Erro ao ler XLSX {url}: {e}")
                return None

        # CSV
        for enc in ('utf-8-sig', 'latin-1', 'iso-8859-1'):
            try:
                content = r.content.decode(enc)
                reader = csv.DictReader(io.StringIO(content), delimiter=';')
                rows = list(reader)
                if rows and len(rows[0]) > 1:
                    return rows
            except (UnicodeDecodeError, csv.Error):
                continue
        return None
    except Exception as e:
        log.warning(f"[CLDF] Erro ao baixar {url}: {e}")
        return None


def encontrar_recursos(entidade: str) -> list[dict]:
    """Retorna lista de recursos CKAN para a entidade, usando slugs diretos."""
    recursos = []
    vistos = set()

    # Tentar slugs diretos primeiro (mais confiável)
    slugs = DATASETS_CLDF.get(entidade, [])
    for slug in slugs:
        dados = get_json(f'{CKAN_BASE}/package_show', params={'id': slug})
        if dados and dados.get('success'):
            pkg = dados.get('result', {})
            for resource in pkg.get('resources', []):
                rid = resource.get('id')
                fmt = (resource.get('format') or '').lower()
                url = resource.get('url', '')
                if rid and rid not in vistos:
                    vistos.add(rid)
                    recursos.append({
                        'id': rid,
                        'name': resource.get('name', ''),
                        'url': url,
                        'format': fmt,
                        'package': pkg.get('title', ''),
                    })
        time.sleep(0.5)

    # Fallback: busca por palavras-chave
    if not recursos:
        queries = QUERIES_CKAN.get(entidade, [])
        for q in queries:
            packages = ckan_search(q)
            for pkg in packages:
                for resource in pkg.get('resources', []):
                    rid = resource.get('id')
                    fmt = (resource.get('format') or '').lower()
                    if rid and rid not in vistos and fmt in ('csv', 'json', 'xlsx', ''):
                        vistos.add(rid)
                        recursos.append({
                            'id': rid,
                            'name': resource.get('name', ''),
                            'url': resource.get('url', ''),
                            'format': fmt,
                            'package': pkg.get('title', ''),
                        })
            time.sleep(0.5)

    log.info(f"[CLDF] {len(recursos)} recursos encontrados para '{entidade}'")
    return recursos


# ──────────────────────────────────────────────────────────────────────────────
# Presenças
# ──────────────────────────────────────────────────────────────────────────────

def collect_presencas(conn, anos: list[int]) -> int:
    log.info(f"[CLDF] Coletando presenças para {anos}...")

    with conn.cursor() as cur:
        mapa = buscar_mapa_deputados_uf(cur, UF)

    recursos = encontrar_recursos('presencas')
    total = 0

    # Mapeamento de colunas possíveis (CLDF muda o schema entre versões)
    cols_nome = ('parlamentar', 'nome', 'deputado', 'nome_parlamentar')
    cols_data = ('data', 'data_sessao', 'date', 'sessao_data')
    cols_presenca = ('presenca', 'presente', 'situacao', 'status')
    cols_tipo = ('tipo_sessao', 'tipo', 'natureza')

    for rec in recursos:
        url = rec.get('url', '')
        if not url:
            url = ckan_resource_url(rec['id']) or ''
        if not url:
            continue

        linhas = baixar_tabela(url, rec.get('format', '')) if rec.get('format', '').upper() != 'JSON' else None

        if linhas is None:
            # Tentar JSON
            dados_json = get_json(url)
            if isinstance(dados_json, list):
                linhas = dados_json
            elif isinstance(dados_json, dict):
                linhas = dados_json.get('data', dados_json.get('records', []))

        if not linhas:
            continue

        log.info(f"[CLDF] Processando {len(linhas)} linhas de {rec['name']}")

        batch = []
        for linha in linhas:
            # Normaliza keys para minúsculo
            linha_norm = {k.lower().strip(): v for k, v in linha.items() if k}

            # Nome do parlamentar → match com banco
            nome = ''
            for col in cols_nome:
                nome = (linha_norm.get(col) or '').strip()
                if nome:
                    break

            politico_id = None
            # Tentar por id_ale primeiro
            id_ale_raw = str(linha_norm.get('id') or linha_norm.get('id_parlamentar') or '')
            if id_ale_raw:
                politico_id = mapa.get(id_ale_raw)
            if not politico_id and nome:
                with conn.cursor() as cur:
                    politico_id = buscar_politico_por_nome(cur, nome, UF)
            if not politico_id:
                continue

            data_str = ''
            for col in cols_data:
                data_str = (linha_norm.get(col) or '').strip()
                if data_str:
                    break
            data = parse_data(data_str)
            if not data:
                continue
            if data.year not in anos:
                continue

            presente_raw = ''
            for col in cols_presenca:
                presente_raw = (linha_norm.get(col) or '').strip()
                if presente_raw:
                    break
            presente = str(presente_raw).lower() in ('presente', 'sim', 'p', '1', 'true', 's')

            justificativa = normalizar_justificativa(
                linha_norm.get('justificativa') or linha_norm.get('motivo')
            )
            tipo_sessao = 'plenario'
            tipo_raw = ''
            for col in cols_tipo:
                tipo_raw = (linha_norm.get(col) or '').lower().strip()
                if tipo_raw:
                    break
            if 'comiss' in tipo_raw:
                tipo_sessao = 'comissao'

            id_sessao = (linha_norm.get('id_sessao') or linha_norm.get('numero_sessao') or data_str)
            source_rec = f'cldf_{nome[:20]}_{data}_{id_sessao}'

            batch.append((
                politico_id, data, UF, tipo_sessao, presente, justificativa,
                FONTE, FONTE, source_rec
            ))

        if batch:
            with conn.cursor() as cur:
                cur.executemany("""
                    INSERT INTO ale_presencas
                        (politico_id, data, uf, tipo_sessao, presente, justificativa,
                         fonte, source_id, source_record_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (source_id, source_record_id) DO UPDATE SET
                        presente = EXCLUDED.presente,
                        justificativa = EXCLUDED.justificativa
                """, batch)
                conn.commit()
                total += len(batch)

    log.info(f"[CLDF] Total presenças: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Votações
# ──────────────────────────────────────────────────────────────────────────────

def collect_votacoes(conn, anos: list[int]) -> int:
    log.info(f"[CLDF] Coletando votações para {anos}...")

    with conn.cursor() as cur:
        mapa = buscar_mapa_deputados_uf(cur, UF)

    recursos = encontrar_recursos('votacoes')
    total = 0

    cols_nome = ('parlamentar', 'nome', 'deputado')
    cols_data = ('data', 'data_votacao', 'data_sessao')
    cols_voto = ('voto', 'orientacao', 'decisao')
    cols_prop = ('proposicao', 'projeto', 'sigla', 'numero')

    for rec in recursos:
        url = rec.get('url', '') or ckan_resource_url(rec['id']) or ''
        if not url:
            continue

        linhas = baixar_tabela(url, rec.get('format', ''))
        if not linhas:
            dados_json = get_json(url)
            if isinstance(dados_json, list):
                linhas = dados_json
            elif isinstance(dados_json, dict):
                linhas = dados_json.get('data', [])

        if not linhas:
            continue

        batch = []
        for linha in linhas:
            linha_norm = {k.lower().strip(): v for k, v in linha.items() if k}

            data_str = next((linha_norm.get(c, '') for c in cols_data if linha_norm.get(c)), '')
            data = parse_data(data_str)
            if not data or data.year not in anos:
                continue

            voto_raw = next((linha_norm.get(c, '') for c in cols_voto if linha_norm.get(c)), '')
            voto_norm = normalizar_voto(str(voto_raw))
            if not voto_norm:
                continue

            nome = next((linha_norm.get(c, '').strip() for c in cols_nome if linha_norm.get(c)), '')
            id_ale_raw = str(linha_norm.get('id') or linha_norm.get('id_parlamentar') or '')
            politico_id = mapa.get(id_ale_raw)
            if not politico_id and nome:
                with conn.cursor() as cur:
                    politico_id = buscar_politico_por_nome(cur, nome, UF)
            if not politico_id:
                continue

            proposicao_str = next((linha_norm.get(c, '') for c in cols_prop if linha_norm.get(c)), '')[:200]
            descricao = (linha_norm.get('descricao') or linha_norm.get('ementa') or '')[:500]
            id_vot = (linha_norm.get('id_votacao') or linha_norm.get('numero') or data_str)
            source_rec = f'cldf_vot_{nome[:15]}_{data}_{id_vot}'

            batch.append((
                politico_id, data, voto_norm, descricao[:500], proposicao_str,
                url[:200], FONTE, source_rec
            ))

        if batch:
            with conn.cursor() as cur:
                cur.executemany("""
                    INSERT INTO votacoes
                        (politico_id, data, voto, descricao, proposicao,
                         link_fonte, source_id, source_record_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (source_id, source_record_id) DO UPDATE SET
                        voto = EXCLUDED.voto
                """, batch)
                conn.commit()
                total += len(batch)

    log.info(f"[CLDF] Total votações: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Despesas
# ──────────────────────────────────────────────────────────────────────────────

def collect_despesas(conn, anos: list[int]) -> int:
    """
    Colunas reais do CSV/XLSX do CLDF (confirmadas 2026-05-23):
    NOME_PARLAMENTAR, NOME_PRESTADOR, CNPJ_PRESTADOR, CPF_PRESTADOR,
    NR_COMPROVANTE, DATA_COMPROVANTE (YYYY-MM-DD), VALOR_DESPESA (vírgula),
    CLASSIFICACAO, OBSERVACOES
    """
    log.info(f"[CLDF] Coletando despesas para {anos}...")

    with conn.cursor() as cur:
        # Mapa nome_eleitoral.lower() → politico_id
        cur.execute("""
            SELECT LOWER(nome_eleitoral), id, LOWER(nome) FROM politicos
            WHERE cargo = 'deputado_estadual' AND uf = %s AND removido_em IS NULL
        """, (UF,))
        mapa_nome = {}
        for nome_el, uuid, nome_c in cur.fetchall():
            if nome_el:
                mapa_nome[nome_el] = uuid
            if nome_c:
                mapa_nome[nome_c] = uuid

    recursos = encontrar_recursos('despesas')
    total = 0

    for rec in recursos:
        url = rec.get('url', '') or ckan_resource_url(rec['id']) or ''
        if not url:
            continue

        fmt = rec.get('format', '')
        linhas = baixar_tabela(url, fmt)
        if not linhas:
            continue

        log.info(f"[CLDF] {rec['name']}: {len(linhas)} linhas")

        batch = []
        for linha in linhas:
            # Normalizar chaves (UPPERCASE → lower)
            linha_norm = {k.upper().strip(): str(v or '').strip() for k, v in linha.items() if k}

            # Deputado — coluna real: NOME_PARLAMENTAR
            nome_raw = (linha_norm.get('NOME_PARLAMENTAR') or '').strip()
            # Remove prefixos como "Deputado ", "Deputada "
            nome = nome_raw.replace('Deputado ', '').replace('Deputada ', '').strip()

            politico_id = mapa_nome.get(nome.lower())
            if not politico_id and nome:
                with conn.cursor() as cur:
                    politico_id = buscar_politico_por_nome(cur, nome, UF)
            if not politico_id:
                continue

            # Data — coluna real: DATA_COMPROVANTE (YYYY-MM-DD)
            data = parse_data(linha_norm.get('DATA_COMPROVANTE') or '')
            if not data or data.year not in anos:
                continue

            # Valor — coluna real: VALOR_DESPESA (usa vírgula)
            valor_raw = linha_norm.get('VALOR_DESPESA') or '0'
            try:
                valor = float(valor_raw.replace(',', '.').replace('R$', '').strip())
            except ValueError:
                continue
            if valor <= 0:
                continue

            ano = data.year
            mes = data.month
            categoria = (linha_norm.get('CLASSIFICACAO') or 'outros')[:100]
            fornecedor = (linha_norm.get('NOME_PRESTADOR') or '')[:200]
            cnpj = (linha_norm.get('CNPJ_PRESTADOR') or linha_norm.get('CPF_PRESTADOR') or '')[:20] or None
            nr_comp = linha_norm.get('NR_COMPROVANTE') or ''
            source_rec = f'cldf_desp_{ano}_{mes}_{nome[:15]}_{nr_comp}'

            batch.append((
                politico_id, ano, mes or None, valor,
                categoria, fornecedor, cnpj,
                FONTE, source_rec
            ))

        if batch:
            with conn.cursor() as cur:
                cur.executemany("""
                    INSERT INTO gastos
                        (politico_id, ano, mes, valor, categoria,
                         fornecedor, cnpj_cpf, source_id, source_record_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (source_id, source_record_id) DO UPDATE SET
                        valor = EXCLUDED.valor
                """, batch)
                conn.commit()
                total += len(batch)

    log.info(f"[CLDF] Total despesas: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='ETL CLDF — Câmara Legislativa do DF')
    parser.add_argument('--entidade',
                        choices=['presencas', 'votacoes', 'despesas', 'tudo'],
                        default='tudo')
    parser.add_argument('--ano', nargs='+', type=int, default=ANOS_PADRAO)
    args = parser.parse_args()

    conn = get_db()
    try:
        totais = {}
        if args.entidade in ('presencas', 'tudo'):
            totais['presencas'] = collect_presencas(conn, args.ano)
        if args.entidade in ('votacoes', 'tudo'):
            totais['votacoes'] = collect_votacoes(conn, args.ano)
        if args.entidade in ('despesas', 'tudo'):
            totais['despesas'] = collect_despesas(conn, args.ano)

        with conn.cursor() as cur:
            for entidade, n in totais.items():
                registrar_coleta(cur, FONTE, entidade, n)
            conn.commit()

        log.info(f"[CLDF] Concluído: {totais}")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
