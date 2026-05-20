"""
Coleta e atualiza dados econômicos estaduais do IBGE:
  - PIB por estado (Contas Regionais — agregado 5938)
  - PIB per capita (calculado)
  - População estimada
  - Ranking nacional

Fontes:
  PIB:       https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/YYYY/variaveis/37
  Populacao: https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/YYYY/variaveis/9324

Tabelas afetadas: estados_economia

Uso:
  python collect_estados_ibge.py [--ano 2023]
"""

import argparse
import logging
import os
import time
from datetime import datetime

import psycopg
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.headers.update({
    'Accept': 'application/json',
    'User-Agent': 'meuspoliticos-etl/1.0',
})

# Mapeamento de código IBGE de estado (2 dígitos) → sigla
COD_TO_SIGLA = {
    '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA',
    '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
    '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE',
    '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
    '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT',
    '52': 'GO', '53': 'DF',
}


def get_db():
    return psycopg.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        user=os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='prefer',
    )


def fetch_sidra(agregado: str, variavel: str, ano: int) -> dict[str, float]:
    """Retorna dict {sigla_estado: valor} do SIDRA."""
    url = (
        f'https://servicodados.ibge.gov.br/api/v3/agregados/{agregado}'
        f'/periodos/{ano}/variaveis/{variavel}?localidades=N3[all]'
    )
    for tentativa in range(3):
        try:
            r = SESSION.get(url, timeout=60)
            r.raise_for_status()
            dados = r.json()
            resultado = {}
            for variavel_item in dados:
                for res in variavel_item.get('resultados', []):
                    for serie in res.get('series', []):
                        cod = str(serie.get('localidade', {}).get('id', ''))
                        valor_str = serie.get('serie', {}).get(str(ano), '')
                        if not valor_str or valor_str in ('-', '...', ''):
                            continue
                        try:
                            sigla = COD_TO_SIGLA.get(cod)
                            if sigla:
                                resultado[sigla] = float(str(valor_str).replace(',', '.'))
                        except (ValueError, TypeError):
                            pass
            return resultado
        except Exception as exc:
            log.warning('Tentativa %d falhou: %s', tentativa + 1, exc)
            time.sleep(2 ** tentativa)
    log.error('Falha definitiva ao buscar agregado %s variavel %s ano %d', agregado, variavel, ano)
    return {}


def coletar(ano: int):
    log.info('Iniciando coleta IBGE estados — ano %d', ano)
    t0 = time.monotonic()

    # PIB total em R$ mil (variável 37 do agregado 5938)
    log.info('Buscando PIB estadual...')
    pib_rs_mil = fetch_sidra('5938', '37', ano)  # R$ mil

    # Populacao (variável 9324 do agregado 6579 — Censo/estimativa)
    log.info('Buscando população estadual...')
    populacao = fetch_sidra('6579', '9324', ano)
    if not populacao:
        # Fallback: tentar estimativa mais recente
        populacao = fetch_sidra('6579', '9324', 2022)

    if not pib_rs_mil:
        log.error('Sem dados de PIB — interrompendo.')
        return

    db = get_db()
    cur = db.cursor()

    ok = 0
    for sigla, pib_mil in pib_rs_mil.items():
        pib_mi = pib_mil / 1000  # R$ mil → R$ milhões
        pop = populacao.get(sigla)
        pib_pc = round(pib_mil * 1000 / pop, 2) if pop and pop > 0 else None

        cur.execute(
            '''
            INSERT INTO estados_economia
              (sigla, ano, pib_total_mi, pib_per_capita, populacao, source_id, collected_at)
            VALUES (%s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (sigla, ano) DO UPDATE SET
              pib_total_mi   = EXCLUDED.pib_total_mi,
              pib_per_capita = EXCLUDED.pib_per_capita,
              populacao      = COALESCE(EXCLUDED.populacao, estados_economia.populacao),
              source_id      = EXCLUDED.source_id,
              collected_at   = now(),
              atualizado_em  = now()
            ''',
            (sigla, ano, round(pib_mi, 2), pib_pc, pop, f'ibge_contas_regionais_{ano}'),
        )
        ok += 1

    # Calcular ranking de PIB nacional
    cur.execute(
        '''
        UPDATE estados_economia e
        SET ranking_pib_nacional = r.ranking
        FROM (
          SELECT sigla,
                 RANK() OVER (PARTITION BY ano ORDER BY pib_total_mi DESC NULLS LAST) AS ranking
          FROM estados_economia WHERE ano = %s
        ) r
        WHERE e.sigla = r.sigla AND e.ano = %s
        ''',
        (ano, ano),
    )

    db.commit()
    db.close()

    duracao = time.monotonic() - t0
    log.info('Concluído: %d estados atualizados em %.1fs', ok, duracao)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Coleta dados econômicos estaduais do IBGE')
    parser.add_argument('--ano', type=int, default=datetime.now().year - 1,
                        help='Ano de referência (padrão: ano anterior)')
    args = parser.parse_args()
    coletar(args.ano)
