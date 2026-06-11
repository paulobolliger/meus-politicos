"""
collect_alesc_bulk.py — Importador em Lote (Bulk CSV) de Santa Catarina (ALESC)

Dados obtidos diretamente do Portal de Transparência da ALESC:
  - Despesas de Gabinete: https://transparencia.alesc.sc.gov.br/gabinetes-parlamentares/csv/{ano}
  - Diárias e Viagens: https://transparencia.alesc.sc.gov.br/diarias/csv/{ano}

Uso:
    python -m etl.ale.collect_alesc_bulk
    python -m etl.ale.collect_alesc_bulk --ano 2025 2026
"""

import argparse
import logging
import re
import hashlib
import urllib3
import requests
from datetime import date

from .base import (
    get_db, buscar_politico_por_nome, registrar_coleta, parse_data
)

# Desativar avisos de SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

log = logging.getLogger(__name__)

FONTE = 'alesc_bulk'
UF = 'SC'
ANO_ATUAL = date.today().year
ANOS_PADRAO = [ANO_ATUAL - 1, ANO_ATUAL]


def normalizar_nome_deputado(nome: str) -> str:
    """
    Remove textos em parênteses e limpa espaços extras.
    Ex: "Ana Paula da Silva (Paulinha)" -> "Ana Paula da Silva"
    """
    nome_limpo = re.sub(r'\(.*?\)', '', nome)
    return nome_limpo.strip()


def parse_valor_brasileiro(valor_str: str) -> float:
    """
    Converte valor em formato brasileiro (ex: 1.842,58) para float.
    """
    if not valor_str:
        return 0.0
    try:
        clean = valor_str.replace('.', '').replace(',', '.').strip()
        return float(clean)
    except ValueError:
        return 0.0


def collect_despesas_gabinete(conn, anos: list[int]) -> int:
    log.info(f"[ALESC] Coletando despesas de gabinete para os anos: {anos}...")
    total = 0

    # 1. Carregar mapeamento de deputados de SC em memória
    from unidecode import unidecode
    mapa_deputados = {}
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, nome_eleitoral, nome 
            FROM politicos 
            WHERE cargo = 'deputado_estadual' AND uf = 'SC' AND removido_em IS NULL
        """)
        for uuid, nome_el, nome_c in cur.fetchall():
            if nome_el:
                mapa_deputados[unidecode(nome_el).lower().strip()] = uuid
            if nome_c:
                mapa_deputados[unidecode(nome_c).lower().strip()] = uuid

    for ano in anos:
        url = f'https://transparencia.alesc.sc.gov.br/gabinetes-parlamentares/csv/{ano}'
        log.info(f"[ALESC] Baixando despesas do ano {ano} de {url}...")
        
        try:
            r = requests.get(url, verify=False, timeout=60, headers={'User-Agent': 'Mozilla/5.0'})
            r.raise_for_status()
            content = r.text
        except Exception as e:
            log.error(f"[ALESC] Falha ao baixar despesas de gabinete para o ano {ano}: {e}")
            continue

        lines = content.split('\n')
        if not lines or len(lines) <= 1:
            log.warning(f"[ALESC] Arquivo de despesas do ano {ano} está vazio ou tem apenas cabeçalho.")
            continue

        # Tratar UTF-8 BOM se presente
        if lines[0].startswith('\ufeff'):
            lines[0] = lines[0].replace('\ufeff', '')

        # Cabeçalho esperado: Verba;Descrição;Conta;Favorecido;Trecho;Vencimento;Valor
        header = [h.strip().upper() for h in lines[0].split(';')]
        if 'CONTA' not in header or 'VALOR' not in header:
            log.error(f"[ALESC] Cabeçalho inválido no CSV de despesas de {ano}: {lines[0]}")
            continue

        col_verba = header.index('VERBA') if 'VERBA' in header else -1
        col_desc = header.index('DESCRIÇÃO') if 'DESCRIÇÃO' in header else (header.index('DESCRICAO') if 'DESCRICAO' in header else -1)
        col_conta = header.index('CONTA')
        col_favorecido = header.index('FAVORECIDO') if 'FAVORECIDO' in header else -1
        col_vencimento = header.index('VENCIMENTO') if 'VENCIMENTO' in header else -1
        col_valor = header.index('VALOR')

        batch = []
        
        for idx, line in enumerate(lines[1:]):
            parts = [p.replace('"', '').strip() for p in line.split(';')]
            if len(parts) < max(col_conta, col_valor) + 1:
                continue

            conta = parts[col_conta]
            if not conta:
                continue

            # Mapear deputado pelo nome limpo
            nome_dep = normalizar_nome_deputado(conta)
            nome_dep_norm = unidecode(nome_dep).lower().strip()
            politico_id = mapa_deputados.get(nome_dep_norm)

            if not politico_id:
                # Omitir se não achar correspondente no banco (pode ser setor administrativo)
                continue

            valor = parse_valor_brasileiro(parts[col_valor])
            if valor <= 0:
                continue

            venc_str = parts[col_vencimento] if col_vencimento >= 0 else None
            data_exp = parse_data(venc_str)
            ano_exp = data_exp.year if data_exp else ano
            mes_exp = data_exp.month if data_exp else 1

            verba = parts[col_verba] if col_verba >= 0 else 'Outros'
            descricao = parts[col_desc] if col_desc >= 0 else ''
            favorecido = parts[col_favorecido] if col_favorecido >= 0 else ''

            categoria = verba
            fornecedor = favorecido or descricao or 'Diversos'

            # Gerar hash único para a despesa
            raw_id = f"alesc_gab_{conta}_{verba}_{venc_str or ''}_{valor}_{favorecido}_{descricao}_{idx}"
            source_rec = hashlib.sha256(raw_id.encode('utf-8')).hexdigest()

            batch.append((
                politico_id, ano_exp, mes_exp, valor,
                categoria[:100], fornecedor[:200], None,
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

    log.info(f"[ALESC] Total despesas de gabinete importadas: {total}")
    return total


def collect_diarias(conn, anos: list[int]) -> int:
    log.info(f"[ALESC] Coletando diárias para os anos: {anos}...")
    total = 0

    # 1. Carregar mapeamento de deputados de SC em memória
    from unidecode import unidecode
    mapa_deputados = {}
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, nome_eleitoral, nome 
            FROM politicos 
            WHERE cargo = 'deputado_estadual' AND uf = 'SC' AND removido_em IS NULL
        """)
        for uuid, nome_el, nome_c in cur.fetchall():
            if nome_el:
                mapa_deputados[unidecode(nome_el).lower().strip()] = uuid
            if nome_c:
                mapa_deputados[unidecode(nome_c).lower().strip()] = uuid

    for ano in anos:
        url = f'https://transparencia.alesc.sc.gov.br/diarias/csv/{ano}'
        log.info(f"[ALESC] Baixando diárias do ano {ano} de {url}...")

        try:
            r = requests.get(url, verify=False, timeout=60, headers={'User-Agent': 'Mozilla/5.0'})
            r.raise_for_status()
            content = r.text
        except Exception as e:
            log.error(f"[ALESC] Falha ao baixar diárias para o ano {ano}: {e}")
            continue

        lines = content.split('\n')
        if not lines or len(lines) <= 1:
            log.warning(f"[ALESC] Arquivo de diárias do ano {ano} está vazio ou tem apenas cabeçalho.")
            continue

        if lines[0].startswith('\ufeff'):
            lines[0] = lines[0].replace('\ufeff', '')

        header = [h.strip().upper() for h in lines[0].split(';')]
        if 'CONTA' not in header or 'VALOR' not in header:
            log.error(f"[ALESC] Cabeçalho inválido no CSV de diárias de {ano}: {lines[0]}")
            continue

        col_nome = header.index('NOME')
        col_conta = header.index('CONTA')
        col_vinculo = header.index('VÍNCULO') if 'VÍNCULO' in header else (header.index('VINCULO') if 'VINCULO' in header else -1)
        col_data = header.index('DATA')
        col_valor = header.index('VALOR')
        col_relatorio = header.index('RELATÓRIO') if 'RELATÓRIO' in header else (header.index('RELATORIO') if 'RELATORIO' in header else -1)

        # Pass 1: Build the map of Conta ID -> politico_uuid from lines where Vinculo is Deputado
        conta_to_politico = {}
        for line in lines[1:]:
            parts = [p.replace('"', '').strip() for p in line.split(';')]
            if len(parts) < max(col_conta, col_nome) + 1:
                continue
            
            vinculo = parts[col_vinculo] if col_vinculo >= 0 else ''
            if vinculo.upper() == 'DEPUTADO':
                conta = parts[col_conta]
                nome = parts[col_nome]
                if conta and nome:
                    nome_dep = normalizar_nome_deputado(nome)
                    nome_dep_norm = unidecode(nome_dep).lower().strip()
                    politico_id = mapa_deputados.get(nome_dep_norm)
                    if politico_id:
                        conta_to_politico[conta] = politico_id

        # Pass 2: Ingest all records (Deputado and Servidores mapped to a Deputy cabinet)
        batch = []
        for idx, line in enumerate(lines[1:]):
            parts = [p.replace('"', '').strip() for p in line.split(';')]
            if len(parts) < max(col_conta, col_valor) + 1:
                continue

            conta = parts[col_conta]
            vinculo = parts[col_vinculo] if col_vinculo >= 0 else ''
            nome = parts[col_nome]
            if not conta or not nome:
                continue

            politico_id = None
            if vinculo.upper() == 'DEPUTADO':
                politico_id = conta_to_politico.get(conta)
            else:
                # Servidor: Associar ao gabinete do deputado pela Conta ID
                politico_id = conta_to_politico.get(conta)

            if not politico_id:
                continue

            valor = parse_valor_brasileiro(parts[col_valor])
            if valor <= 0:
                continue

            data_str = parts[col_data] if col_data >= 0 else None
            data_exp = parse_data(data_str)
            ano_exp = data_exp.year if data_exp else ano
            mes_exp = data_exp.month if data_exp else 1

            relatorio = parts[col_relatorio] if col_relatorio >= 0 else ''
            
            categoria = 'Diárias e Viagens'
            fornecedor = f"Beneficiário: {nome} ({vinculo})"

            # Gerar ID estável usando o link do relatório se houver, ou hash da linha
            if relatorio:
                source_rec = f"alesc_diaria_{relatorio.split('/')[-1]}"
            else:
                raw_id = f"alesc_diaria_{conta}_{nome}_{data_str or ''}_{valor}_{idx}"
                source_rec = hashlib.sha256(raw_id.encode('utf-8')).hexdigest()

            batch.append((
                politico_id, data_exp.year if data_exp else ano, data_exp.month if data_exp else 1, valor,
                categoria, fornecedor, None,
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

    log.info(f"[ALESC] Total diárias importadas: {total}")
    return total


def main():
    parser = argparse.ArgumentParser(description='ETL ALESC Bulk — Importador de dados em lote de Santa Catarina')
    parser.add_argument('--entidade', choices=['despesas', 'diarias', 'tudo'], default='tudo')
    parser.add_argument('--ano', nargs='+', type=int, default=ANOS_PADRAO)
    args = parser.parse_args()

    conn = get_db()
    try:
        totais = {}
        if args.entidade in ('despesas', 'tudo'):
            totais['despesas'] = collect_despesas_gabinete(conn, args.ano)
        if args.entidade in ('diarias', 'tudo'):
            totais['diarias'] = collect_diarias(conn, args.ano)

        with conn.cursor() as cur:
            for entidade, n in totais.items():
                registrar_coleta(cur, FONTE, entidade, n)
            conn.commit()

        log.info(f"[ALESC] Concluído com sucesso: {totais}")
    finally:
        conn.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    main()
