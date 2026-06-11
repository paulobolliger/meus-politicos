"""
collect_alesp.py — ETL da Assembleia Legislativa do Estado de São Paulo (ALESP)

API REST: https://www.al.sp.gov.br/dados-abertos/
Dados disponíveis desde 2002. Estrutura mista: REST JSON + XML bulk.

Endpoints principais:
  - Deputados: GET /repositorio/api/deputado/{partido}
  - Bulk XML:  GET /repositorio/publicacao/deputados/deputados.xml
  - Despesas:  GET /repositorio/api/despesa/{ano}/{mes}
  - Presenças: GET /repositorio/api/deputadoPresenca/{id_deputado}
  - Propostas: GET /repositorio/api/propositura
  - Votações:  GET /repositorio/api/votacao/{ano}

Uso:
    python -m etl.ale.collect_alesp
    python -m etl.ale.collect_alesp --entidade presencas --ano 2025
    python -m etl.ale.collect_alesp --entidade despesas --ano 2024 2025
"""

import argparse
import logging
import time
import xml.etree.ElementTree as ET
from datetime import date
from io import BytesIO

import requests

from .base import (
    get_db, get_json,
    buscar_mapa_deputados_uf, buscar_politico_por_nome,
    normalizar_voto, normalizar_justificativa, parse_data,
    registrar_coleta
)

log = logging.getLogger(__name__)

BASE_URL = 'https://www.al.sp.gov.br/dados-abertos/api'
FONTE = 'alesp'
UF = 'SP'
ANO_ATUAL = date.today().year
ANOS_PADRAO = [ANO_ATUAL - 1, ANO_ATUAL]

# Partidos com representação na ALESP (para iterar a API de deputados)
PARTIDOS_ALESP = [
    'PT', 'PSDB', 'PL', 'MDB', 'PP', 'REPUBLICANOS', 'UNION', 'PDT',
    'PSD', 'PODEMOS', 'SOLIDARIEDADE', 'PSOL', 'PSB', 'AVANTE', 'AGIR',
    'DC', 'PCdoB', 'PROS', 'PTB', 'PRD', 'NOVO', 'PATRIOTA', 'PODE',
]


# ──────────────────────────────────────────────────────────────────────────────
# Deputados (via bulk XML — mais completo)
# ──────────────────────────────────────────────────────────────────────────────

def collect_deputados_xml(conn) -> int:
    """
    Baixa o XML bulk de deputados e atualiza id_ale no banco.
    URL: https://www.al.sp.gov.br/repositorioDados/deputados/deputados.xml
    """
    log.info("[ALESP] Baixando XML bulk de deputados...")
    url = 'https://www.al.sp.gov.br/repositorioDados/deputados/deputados.xml'

    try:
        r = requests.get(url, timeout=60,
                         headers={'User-Agent': 'MeusPoliticosBR/1.0'})
        r.raise_for_status()
        root = ET.fromstring(r.content)
    except Exception as e:
        log.error(f"[ALESP] Falha ao baixar XML: {e}")
        return 0

    total = 0
    with conn.cursor() as cur:
        for dep in root.findall('.//Deputado'):
            id_ale = (dep.findtext('IdDeputado') or dep.findtext('Id') or '').strip()
            nome = (dep.findtext('NomeParlamentar') or dep.findtext('Nome') or '').strip()
            foto_url = (dep.findtext('PathFoto') or dep.findtext('Foto') or '').strip() or None
            email = (dep.findtext('Email') or '').strip() or None

            if not id_ale:
                continue

            cur.execute("""
                UPDATE politicos SET
                    id_ale    = COALESCE(id_ale, %s),
                    foto_url  = COALESCE(foto_url, %s),
                    email     = COALESCE(email, %s),
                    atualizado_em = now()
                WHERE cargo = 'deputado_estadual' AND uf = %s
                  AND (id_ale = %s OR nome_eleitoral ILIKE %s)
                  AND removido_em IS NULL
            """, (id_ale, foto_url, email, UF, id_ale, nome))

            if cur.rowcount > 0:
                total += 1

        conn.commit()

    log.info(f"[ALESP] {total} deputados atualizados via XML")
    return total


def collect_deputados_rest(conn) -> int:
    """
    Complemento: itera por partido via REST API.
    """
    log.info("[ALESP] Coletando deputados via REST por partido...")
    total = 0

    with conn.cursor() as cur:
        for partido in PARTIDOS_ALESP:
            dados = get_json(f'{BASE_URL}/deputado', params={'partido': partido})
            if not dados:
                continue

            itens = dados if isinstance(dados, list) else dados.get('deputies', dados.get('data', []))

            for dep in itens:
                id_ale = str(dep.get('id') or dep.get('idDeputado') or '')
                nome = (dep.get('name') or dep.get('nome') or '').strip()
                foto_url = dep.get('picture') or dep.get('foto')
                email = dep.get('email')

                if not id_ale:
                    continue

                cur.execute("""
                    UPDATE politicos SET
                        id_ale    = COALESCE(id_ale, %s),
                        foto_url  = COALESCE(foto_url, %s),
                        email     = COALESCE(email, %s),
                        atualizado_em = now()
                    WHERE cargo = 'deputado_estadual' AND uf = %s
                      AND (id_ale = %s OR nome_eleitoral ILIKE %s)
                      AND removido_em IS NULL
                """, (id_ale, foto_url, email, UF, id_ale, nome))

                if cur.rowcount > 0:
                    total += 1

            time.sleep(0.3)

        conn.commit()

    log.info(f"[ALESP] {total} atualizações via REST")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Presenças
# ──────────────────────────────────────────────────────────────────────────────

def collect_presencas(conn, anos: list[int]) -> int:
    """
    GET /repositorio/api/deputadoPresenca/{id_deputado}
    Retorna histórico completo de presenças do deputado.
    Filtrar por ano no lado cliente.
    """
    log.info(f"[ALESP] Coletando presenças para {anos}...")

    with conn.cursor() as cur:
        cur.execute("""
            SELECT id_ale, id FROM politicos
            WHERE cargo = 'deputado_estadual' AND uf = %s
              AND id_ale IS NOT NULL AND removido_em IS NULL
        """, (UF,))
        deputados = cur.fetchall()

    total = 0

    for id_ale, politico_id in deputados:
        dados = get_json(f'{BASE_URL}/deputadoPresenca', params={'deputado': id_ale})
        if not dados:
            time.sleep(0.5)
            continue

        itens = dados if isinstance(dados, list) else dados.get('data', dados.get('presencas', []))

        batch = []
        for s in itens:
            data_str = s.get('data') or s.get('date') or s.get('DataSessao') or ''
            data = parse_data(data_str)
            if not data:
                continue
            if data.year not in anos:
                continue

            presente_raw = s.get('presente') or s.get('presenca') or s.get('Presenca') or s.get('status') or ''
            if isinstance(presente_raw, bool):
                presente = presente_raw
            else:
                presente = str(presente_raw).lower() in ('presente', 'sim', 'p', '1', 'true', 's')

            justificativa = normalizar_justificativa(
                s.get('justificativa') or s.get('motivo') or s.get('Motivo')
            )
            tipo_sessao = 'plenario'
            tipo_raw = (s.get('tipo') or s.get('tipoSessao') or s.get('TipoSessao') or '').lower()
            if 'comiss' in tipo_raw:
                tipo_sessao = 'comissao'
            elif 'extraordi' in tipo_raw:
                tipo_sessao = 'extraordinaria'

            id_sessao = str(
                s.get('idSessao') or s.get('id') or s.get('NumeroSessao') or data_str
            )
            source_rec = f'{id_ale}_{data.year}_{id_sessao}'

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
                log.debug(f"[ALESP] Dep {id_ale}: {len(batch)} presenças")

        time.sleep(0.3)

    log.info(f"[ALESP] Total presenças: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Despesas
# ──────────────────────────────────────────────────────────────────────────────

def collect_despesas(conn, anos: list[int]) -> int:
    """
    Baixa o XML bulk de despesas de gabinete e faz a ingestão.
    URL: https://www.al.sp.gov.br/repositorioDados/deputados/despesas_gabinetes.xml
    """
    import hashlib
    log.info(f"[ALESP] Coletando despesas para {anos} via XML bulk...")

    # 1. Carregar mapeamento id_ale (IdDeputado) -> politico_uuid do banco
    with conn.cursor() as cur:
        mapa_id_ale = buscar_mapa_deputados_uf(cur, UF)

    # 2. Baixar deputados.xml para mapear Matricula -> IdDeputado
    url_deps = 'https://www.al.sp.gov.br/repositorioDados/deputados/deputados.xml'
    log.info("[ALESP] Buscando deputados para mapeamento de Matricula...")
    try:
        r = requests.get(url_deps, timeout=60, headers={'User-Agent': 'MeusPoliticosBR/1.0'})
        r.raise_for_status()
        root_deps = ET.fromstring(r.content)
    except Exception as e:
        log.error(f"[ALESP] Falha ao buscar deputados: {e}")
        return 0

    mapa_matricula = {}
    for dep in root_deps.findall('.//Deputado'):
        mat = (dep.findtext('Matricula') or '').strip()
        id_ale = (dep.findtext('IdDeputado') or '').strip()
        if mat and id_ale:
            mapa_matricula[mat] = id_ale

    # Mapear Matricula -> politico_uuid
    mapa_deputados = {}
    for mat, id_ale in mapa_matricula.items():
        if id_ale in mapa_id_ale:
            mapa_deputados[mat] = mapa_id_ale[id_ale]

    # Fallback por nome
    with conn.cursor() as cur:
        for dep in root_deps.findall('.//Deputado'):
            mat = (dep.findtext('Matricula') or '').strip()
            if mat and mat not in mapa_deputados:
                nome = (dep.findtext('NomeParlamentar') or dep.findtext('Nome') or '').strip()
                if nome:
                    uuid = buscar_politico_por_nome(cur, nome, UF)
                    if uuid:
                        mapa_deputados[mat] = uuid

    # 3. Baixar despesas_gabinetes.xml
    url_desp = 'https://www.al.sp.gov.br/repositorioDados/deputados/despesas_gabinetes.xml'
    log.info(f"[ALESP] Baixando XML de despesas ({url_desp})...")
    try:
        r = requests.get(url_desp, timeout=120, headers={'User-Agent': 'MeusPoliticosBR/1.0'})
        r.raise_for_status()
        root_desp = ET.fromstring(r.content)
    except Exception as e:
        log.error(f"[ALESP] Falha ao baixar despesas: {e}")
        return 0

    # 4. Processar despesas
    total = 0
    batch = []
    
    for desp in root_desp.findall('.//despesa'):
        try:
            ano = int(desp.findtext('Ano') or '0')
            if ano not in anos:
                continue

            mes = int(desp.findtext('Mes') or '0')
            if not (1 <= mes <= 12):
                continue

            matricula = (desp.findtext('Matricula') or '').strip()
            politico_id = mapa_deputados.get(matricula)
            if not politico_id:
                continue

            valor_str = (desp.findtext('Valor') or '0').strip()
            valor = float(valor_str)
            if valor <= 0:
                continue

            cnpj = (desp.findtext('CNPJ') or '').strip()
            if not cnpj or cnpj == '0':
                cnpj = None

            categoria = (desp.findtext('Tipo') or 'outros')[:100]
            fornecedor = (desp.findtext('Fornecedor') or '')[:200]

            # Gerar source_record_id estável via sha256
            raw_id = f"{matricula}_{ano}_{mes}_{valor}_{cnpj or ''}_{fornecedor}_{categoria}"
            source_rec = hashlib.sha256(raw_id.encode('utf-8')).hexdigest()

            batch.append((
                politico_id, ano, mes, valor,
                categoria, fornecedor, cnpj,
                FONTE, source_rec
            ))

            if len(batch) >= 500:
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
                batch = []
        except Exception as e:
            log.warning(f"Erro ao processar despesa: {e}")

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

    log.info(f"[ALESP] Total despesas salvas: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Votações
# ──────────────────────────────────────────────────────────────────────────────

def collect_votacoes(conn, anos: list[int]) -> int:
    """
    GET /repositorio/api/votacao/{ano} → lista de votações do plenário
    """
    log.info(f"[ALESP] Coletando votações para {anos}...")

    with conn.cursor() as cur:
        mapa = buscar_mapa_deputados_uf(cur, UF)

    total = 0

    for ano in anos:
        dados = get_json(f'{BASE_URL}/votacao/{ano}')
        if not dados:
            continue

        votacoes = dados if isinstance(dados, list) else dados.get('data', dados.get('votacoes', []))
        log.info(f"[ALESP] {ano}: {len(votacoes)} votações")

        for vot in votacoes:
            id_vot = str(vot.get('id') or vot.get('idVotacao') or '')
            data_str = vot.get('data') or vot.get('dataVotacao') or ''
            data = parse_data(data_str)
            descricao = (vot.get('descricao') or vot.get('ementa') or '')[:500]
            proposicao_str = (vot.get('sigla') or vot.get('proposicao') or '')[:200]

            # Votos nominais dentro do objeto
            votos_list = vot.get('votos') or []
            if not votos_list and id_vot:
                # Buscar endpoint separado se não vier inline
                votos_data = get_json(f'{BASE_URL}/votacao/{ano}/{id_vot}/votos')
                if votos_data:
                    votos_list = votos_data if isinstance(votos_data, list) else votos_data.get('data', [])

            batch = []
            for voto in votos_list:
                id_dep = str(voto.get('idDeputado') or voto.get('id') or '')
                voto_raw = voto.get('voto') or voto.get('orientacao') or ''
                voto_norm = normalizar_voto(str(voto_raw))
                if not voto_norm:
                    continue

                politico_id = mapa.get(id_dep)
                if not politico_id:
                    nome = (voto.get('nome') or voto.get('nomeParlamentar') or '').strip()
                    if nome:
                        with conn.cursor() as cur:
                            politico_id = buscar_politico_por_nome(cur, nome, UF)
                if not politico_id:
                    continue

                source_rec = f'{id_vot}_{id_dep}'
                batch.append((
                    politico_id, data, voto_norm, descricao, proposicao_str,
                    f'{BASE_URL}/votacao/{ano}/{id_vot}', FONTE, source_rec
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

            time.sleep(0.2)

    log.info(f"[ALESP] Total votações: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='ETL ALESP — Assembleia Legislativa de São Paulo')
    parser.add_argument('--entidade',
                        choices=['deputados', 'presencas', 'despesas', 'votacoes', 'tudo'],
                        default='tudo')
    parser.add_argument('--ano', nargs='+', type=int, default=ANOS_PADRAO)
    args = parser.parse_args()

    conn = get_db()
    try:
        totais = {}
        if args.entidade in ('deputados', 'tudo'):
            n1 = collect_deputados_xml(conn)
            n2 = collect_deputados_rest(conn)
            totais['deputados'] = n1 + n2
        if args.entidade in ('presencas', 'tudo'):
            totais['presencas'] = collect_presencas(conn, args.ano)
        if args.entidade in ('despesas', 'tudo'):
            totais['despesas'] = collect_despesas(conn, args.ano)
        if args.entidade in ('votacoes', 'tudo'):
            totais['votacoes'] = collect_votacoes(conn, args.ano)

        with conn.cursor() as cur:
            for entidade, n in totais.items():
                registrar_coleta(cur, FONTE, entidade, n)
            conn.commit()

        log.info(f"[ALESP] Concluído: {totais}")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
