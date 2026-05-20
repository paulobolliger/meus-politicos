"""
Popula/atualiza municipios com dados do IBGE:
  - populacao (Censo 2022)
  - faixa_populacional calculada

Fonte:
  API IBGE SIDRA — Agregado 6579 / Período 2022 / Variável 9324 (população residente)
  https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2022/variaveis/9324?localidades=N6[all]

Tabelas afetadas: municipios

Uso:
  python collect_municipios.py
"""

import os
import time
import logging

import psycopg
import requests
from dotenv import load_dotenv

load_dotenv(
    os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
log = logging.getLogger(__name__)

SIDRA_URL = (
    'https://servicodados.ibge.gov.br/api/v3/agregados/6579'
    '/periodos/2022/variaveis/9324?localidades=N6[all]'
)

SESSION = requests.Session()
SESSION.headers.update({
    'Accept': 'application/json',
    'User-Agent': 'meuspoliticos-etl/1.0',
})


def get_db():
    return psycopg.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        user=os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='prefer',
    )


def faixa(populacao: int | None) -> str | None:
    if populacao is None:
        return None
    if populacao <= 20_000:
        return 'ate_20k'
    if populacao <= 50_000:
        return '20k_50k'
    if populacao <= 100_000:
        return '50k_100k'
    if populacao <= 500_000:
        return '100k_500k'
    return 'acima_500k'


def coletar():
    t0 = time.monotonic()

    log.info('Buscando população dos municípios no IBGE SIDRA...')
    try:
        r = SESSION.get(SIDRA_URL, timeout=120)
        r.raise_for_status()
        dados = r.json()
    except Exception as exc:
        log.error('Falha ao buscar IBGE: %s', exc)
        return

    # Estrutura da resposta:
    # [{ "variavel": "...", "resultados": [{ "classificacoes": [...], "series": [{ "localidade": {...}, "serie": {"2022": "VALOR"} }] }] }]
    pop_por_ibge: dict[str, int] = {}

    for variavel in dados:
        for resultado in variavel.get('resultados', []):
            for serie in resultado.get('series', []):
                localidade = serie.get('localidade', {})
                codigo_ibge7 = str(localidade.get('id', '')).zfill(7)
                valor_str = serie.get('serie', {}).get('2022', '')
                if not valor_str or valor_str in ('-', '...', ''):
                    continue
                try:
                    pop = int(valor_str)
                    pop_por_ibge[codigo_ibge7] = pop
                except (ValueError, TypeError):
                    pass

    if not pop_por_ibge:
        log.error('Nenhum dado de população encontrado na resposta do IBGE.')
        return

    log.info('População obtida para %d municípios. Atualizando banco...', len(pop_por_ibge))

    db = get_db()
    cur = db.cursor()

    ok = 0
    nao_encontrado = 0

    for codigo_ibge7, pop in pop_por_ibge.items():
        # municipios.codigo_ibge pode estar como int ou string; tentamos os dois formatos
        cur.execute(
            '''
            UPDATE municipios
            SET populacao         = %s,
                faixa_populacional = %s,
                atualizado_em     = now()
            WHERE codigo_ibge = %s OR codigo_ibge::text = %s OR lpad(codigo_ibge::text, 7, \'0\') = %s
            ''',
            (pop, faixa(pop), codigo_ibge7, codigo_ibge7, codigo_ibge7),
        )
        if cur.rowcount > 0:
            ok += 1
        else:
            nao_encontrado += 1

    db.commit()

    duracao_s = time.monotonic() - t0
    log.info(
        'Concluído: %d municípios atualizados, %d não encontrados no banco, %.1fs',
        ok, nao_encontrado, duracao_s
    )

    # Relatório rápido de faixas
    cur.execute(
        '''
        SELECT faixa_populacional, COUNT(*) as qtd
        FROM municipios
        WHERE faixa_populacional IS NOT NULL
        GROUP BY faixa_populacional
        ORDER BY qtd DESC
        '''
    )
    log.info('Distribuição por faixa:')
    for row in cur.fetchall():
        log.info('  %-15s %d', row[0], row[1])

    db.close()


if __name__ == '__main__':
    coletar()
