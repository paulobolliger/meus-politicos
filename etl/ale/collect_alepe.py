"""
collect_alepe.py — ETL da Assembleia Legislativa de Pernambuco (ALEPE)

API REST: https://dadosabertos.alepe.pe.gov.br/api/
Endpoints:
  - /api/v1/parlamentares/
  - /api/v1/remuneracao/
  - /api/v1/servidores/

Uso:
    python -m etl.ale.collect_alepe
"""

import argparse
import logging
import re
import urllib3
import requests
from datetime import date

from .base import (
    get_db, buscar_politico_por_nome, registrar_coleta, slugify
)

# Desativar avisos de SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

log = logging.getLogger(__name__)

BASE_URL = 'https://dadosabertos.alepe.pe.gov.br/api'
FONTE = 'alepe'
UF = 'PE'


def collect_deputados(conn) -> int:
    """
    Coleta parlamentares de PE e atualiza id_ale.
    """
    log.info("[ALEPE] Coletando parlamentares...")
    url = f'{BASE_URL}/v1/parlamentares/'
    try:
        r = requests.get(url, verify=False, timeout=30)
        r.raise_for_status()
        dados = r.json()
    except Exception as e:
        log.error(f"[ALEPE] Falha ao coletar parlamentares: {e}")
        return 0

    total = 0
    with conn.cursor() as cur:
        for item in dados:
            nome = (item.get('nomeParlamentar') or '').strip()
            partido = (item.get('partido') or '').strip()
            if not nome:
                continue

            # Usamos o próprio nome como id_ale já que a API não fornece outro ID
            id_ale = nome

            cur.execute("""
                UPDATE politicos SET
                    id_ale    = COALESCE(id_ale, %s),
                    atualizado_em = now()
                WHERE cargo = 'deputado_estadual' AND uf = %s
                  AND (id_ale = %s OR nome_eleitoral ILIKE %s)
                  AND removido_em IS NULL
            """, (id_ale, UF, id_ale, nome))

            if cur.rowcount > 0:
                total += 1

        conn.commit()

    log.info(f"[ALEPE] {total} deputados atualizados.")
    return total


def collect_servidores_gastos(conn) -> int:
    """
    Coleta o quadro de servidores e remunerações, mapeando os salários
    dos servidores comissionados de cada gabinete como despesas de Pessoal em `gastos`.
    """
    log.info("[ALEPE] Coletando servidores e remunerações...")

    # 1. Carregar mapeamento de nomes dos deputados de PE em memória para evitar milhares de consultas
    from unidecode import unidecode
    mapa_deputados = {}
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, nome_eleitoral, nome 
            FROM politicos 
            WHERE cargo = 'deputado_estadual' AND uf = 'PE' AND removido_em IS NULL
        """)
        for uuid, nome_el, nome_c in cur.fetchall():
            if nome_el:
                mapa_deputados[unidecode(nome_el).lower().strip()] = uuid
            if nome_c:
                mapa_deputados[unidecode(nome_c).lower().strip()] = uuid

    # 2. Obter remunerações por cargo
    url_remun = f'{BASE_URL}/v1/remuneracao/'
    try:
        r = requests.get(url_remun, verify=False, timeout=30)
        r.raise_for_status()
        dados_remun = r.json()
    except Exception as e:
        log.error(f"[ALEPE] Falha ao coletar remunerações: {e}")
        return 0

    mapa_cargos = {}
    ano_comp = date.today().year
    mes_comp = date.today().month

    for rem in dados_remun:
        cargo = (rem.get('cargo') or '').upper().strip()
        rem_str = rem.get('remuneracao') or '0'
        # Salvar o maior valor de competência encontrado
        ac = rem.get('anoCompetencia')
        mc = rem.get('mesCompetencia')
        if ac and mc:
            if (ac > ano_comp) or (ac == ano_comp and mc > mes_comp):
                ano_comp = ac
                mes_comp = mc
        
        try:
            val = float(rem_str)
            if val > 0:
                mapa_cargos[cargo] = val
        except ValueError:
            continue

    log.info(f"[ALEPE] Mapeados {len(mapa_cargos)} cargos. Competência identificada: {mes_comp}/{ano_comp}")

    # 3. Obter lista de servidores
    url_serv = f'{BASE_URL}/v1/servidores/'
    try:
        r = requests.get(url_serv, verify=False, timeout=30)
        r.raise_for_status()
        dados_serv = r.json()
    except Exception as e:
        log.error(f"[ALEPE] Falha ao coletar servidores: {e}")
        return 0

    log.info(f"[ALEPE] Processando {len(dados_serv)} servidores...")

    total_gastos = 0
    batch = []

    for s in dados_serv:
        nome_servidor = (s.get('NOME') or '').strip()
        lotacao = (s.get('NOME_LOTACAO') or '').strip()
        cargo_serv = (s.get('CARGO_EFETIVO') or s.get('CARGO_NIVEL') or '').upper().strip()
        
        if not nome_servidor or not lotacao:
            continue

        # Verificar se a lotação pertence a um gabinete de deputado
        # Ex: "GAB.DEP. WANDERSON FLORENCIO" ou "GABINETE DO DEPUTADO WANDERSON FLORENCIO"
        m = re.match(r'^GAB\s*\.?\s*(?:DEP\s*\.?|DEPUTADO\s+|DEPUTADA\s+)(.+)$', lotacao, re.IGNORECASE)
        if not m:
            continue

        nome_dep_raw = m.group(1).strip()
        nome_dep_norm = unidecode(nome_dep_raw).lower().strip()
        
        politico_id = mapa_deputados.get(nome_dep_norm)
        if not politico_id:
            continue

        # Tentar obter remuneração para o cargo do servidor
        valor = mapa_cargos.get(cargo_serv, 0.0)
        if valor <= 0:
            # Fallback se não tiver remuneração exata
            continue

        source_rec = f"alepe_pessoal_{slugify(nome_servidor)}_{ano_comp}_{mes_comp}"

        batch.append((
            politico_id, ano_comp, mes_comp, valor,
            'Pessoal', nome_servidor, None,
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
            total_gastos += len(batch)
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
        total_gastos += len(batch)

    log.info(f"[ALEPE] Inseridas/atualizadas {total_gastos} despesas de gabinete de Pessoal.")
    return total_gastos


def main():
    parser = argparse.ArgumentParser(description='ETL ALEPE — Assembleia Legislativa de Pernambuco')
    parser.add_argument('--entidade', choices=['deputados', 'servidores', 'tudo'], default='tudo')
    args = parser.parse_args()

    conn = get_db()
    try:
        totais = {}
        if args.entidade in ('deputados', 'tudo'):
            totais['deputados'] = collect_deputados(conn)
        if args.entidade in ('servidores', 'tudo'):
            totais['servidores_gastos'] = collect_servidores_gastos(conn)

        with conn.cursor() as cur:
            for entidade, n in totais.items():
                registrar_coleta(cur, FONTE, entidade, n)
            conn.commit()

        log.info(f"[ALEPE] Concluído com sucesso: {totais}")
    finally:
        conn.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    main()
