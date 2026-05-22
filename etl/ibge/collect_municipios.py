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
    os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local')
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
log = logging.getLogger(__name__)

# API SIDRA v1 — formato diferente, mais estável que v3
# t/6579 = Censo 2022, n6/all = todos os municípios, v/9324 = pop residente, p/2022 = período
BASE_SIDRA = 'https://apisidra.ibge.gov.br/values/t/6579/n6/all/v/9324/p/2022'

SESSION = requests.Session()
SESSION.headers.update({
    'Accept': 'application/json',
    'User-Agent': 'meuspoliticos-etl/1.0',
})


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable',
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


def buscar_populacao() -> dict[str, int]:
    """
    Busca população de todos os municípios via IBGE SIDRA v1.
    Retorna dict {codigo_ibge_7dig: populacao}.
    Resposta: lista de dicts, primeira linha = cabeçalho.
    """
    for tentativa in range(3):
        try:
            r = SESSION.get(BASE_SIDRA, timeout=120)
            r.raise_for_status()
            dados = r.json()
            # Debug: mostrar primeiras 2 linhas para entender o formato
            if dados:
                log.info('DEBUG primeiras linhas: %s', dados[:2])
            pop = {}
            for row in dados[1:]:  # pula o cabeçalho
                # Tentar todas as chaves possíveis para código e valor
                codigo = str(
                    row.get('D1C') or row.get('D1N') or
                    row.get('Município (Código)') or row.get('municipio_id') or ''
                ).zfill(7)
                valor_str = str(row.get('V') or row.get('Valor') or '').strip()
                if len(codigo) >= 6 and valor_str and valor_str not in ('-', '...', ''):
                    try:
                        pop[codigo] = int(valor_str)
                    except (ValueError, TypeError):
                        pass
            return pop
        except Exception as exc:
            log.warning('Tentativa %d falhou: %s', tentativa + 1, exc)
            if tentativa < 2:
                time.sleep(3)
    return {}


def coletar():
    t0 = time.monotonic()

    log.info('Buscando população de todos os municípios (IBGE SIDRA v1)...')
    pop_por_ibge = buscar_populacao()

    if not pop_por_ibge:
        log.error('Nenhum dado de população obtido.')
        return

    log.info('Total: %d municípios com população. Atualizando banco...', len(pop_por_ibge))

    db = get_db()
    cur = db.cursor()
    ok = 0
    nao_encontrado = 0

    for codigo_ibge7, pop in pop_por_ibge.items():
        cur.execute(
            '''
            UPDATE municipios
            SET populacao          = %s,
                faixa_populacional = %s,
                atualizado_em      = now()
            WHERE codigo_ibge::text = %s
               OR lpad(codigo_ibge::text, 7, '0') = %s
            ''',
            (pop, faixa(pop), codigo_ibge7, codigo_ibge7),
        )
        if cur.rowcount > 0:
            ok += 1
        else:
            nao_encontrado += 1

    db.commit()

    duracao_s = time.monotonic() - t0
    log.info('Concluído: %d atualizados, %d não encontrados, %.1fs', ok, nao_encontrado, duracao_s)

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
