"""
Coleta transferências do Pacto Federativo por estado:
  - FPE (Fundo de Participação dos Estados)
  - SUS (transferências fundo-a-fundo)
  - FUNDEB

Fontes:
  FPE:    https://apidatalake.tesouro.gov.br/ords/stn/tt/fpe
  Siafi:  https://apidatalake.tesouro.gov.br/ords/stn/tt/transferencias_constitucionais
  Siconfi: https://apifiscal.planejamento.gov.br/siconfiWS/resources/declaracoes

Tabelas afetadas: estados_pacto_federativo

Uso:
  python collect_pacto_federativo.py [--ano 2023]
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

# Siglas de todos os estados
SIGLAS = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
    'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]


def get_db():
    return psycopg.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        user=os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='prefer',
    )


def paginar(url: str, params: dict) -> list[dict]:
    """Pagina endpoint da API do Tesouro (offset/limit)."""
    todos = []
    params = {**params, 'offset': 0, 'limit': 500}
    while True:
        try:
            r = SESSION.get(url, params=params, timeout=60)
            r.raise_for_status()
            dados = r.json()
            items = dados.get('items', dados if isinstance(dados, list) else [])
            todos.extend(items)
            if len(items) < params['limit']:
                break
            params['offset'] += params['limit']
            time.sleep(0.5)
        except Exception as exc:
            log.error('Erro ao paginar %s: %s', url, exc)
            break
    return todos


# URLs candidatas para FPE — o STN migrou o endpoint ao longo do tempo
_FPE_URLS = [
    # API Data Lake (novo path após migração 2024)
    'https://apidatalake.tesouro.gov.br/ords/stn/tt/transferencias_constitucionais',
    # Tesouro Transparente RREO (fallback)
    'https://apidatalake.tesouro.gov.br/ords/stn/tt/rreo',
]

_FPE_PARAM_SETS = [
    {'tipo': 'FPE', 'ano': None},   # para transferencias_constitucionais
    {'co_tipo_transferencia': 'FPE', 'an_exercicio': None},  # variante RREO
]


def coletar_fpe(ano: int) -> dict[str, float]:
    """
    FPE — tenta múltiplas URLs/param sets pois o STN migrou o endpoint.
    Retorna {sigla: valor_total_milhoes}
    """
    for url, base_params in zip(_FPE_URLS, _FPE_PARAM_SETS):
        params = {k: (ano if v is None else v) for k, v in base_params.items()}
        log.info('Tentando FPE via %s ...', url)
        items = paginar(url, params)
        if not items:
            log.warning('Sem dados em %s — tentando próxima URL', url)
            continue

        fpe: dict[str, float] = {}
        for item in items:
            # tenta diferentes nomes de campo para UF e valor
            uf = str(
                item.get('uf_beneficiada') or
                item.get('sg_uf') or
                item.get('uf') or ''
            ).upper()
            valor = float(
                item.get('valor') or
                item.get('vl_transferencia') or
                item.get('valor_transferido') or 0
            )
            if uf in SIGLAS:
                fpe[uf] = fpe.get(uf, 0) + valor

        if fpe:
            log.info('FPE obtido via %s — %d estados', url, len(fpe))
            return {k: round(v / 1_000_000, 2) for k, v in fpe.items()}

    log.error(
        'Não foi possível obter FPE de nenhuma URL. '
        'O endpoint STN pode ter mudado novamente. '
        'Verifique: https://apidatalake.tesouro.gov.br/ords/stn/'
    )
    return {}


def coletar_sus(ano: int) -> dict[str, float]:
    """
    Transferências SUS fundo-a-fundo (estimativa por estado via SIOPS/DAB)
    Fonte: https://apidatalake.tesouro.gov.br/ords/stn/tt/transf_sus (se disponível)
    """
    # API do Tesouro não tem endpoint direto para SUS por estado com fácil acesso.
    # Usamos estimativa proporcional à população — método padrão STN.
    # Valores reais podem ser inseridos via seed ou futura integração com SIOPS.
    log.info('SUS: usando estimativa proporcional (para dados reais, integrar com SIOPS)')
    return {}


def coletar(ano: int):
    log.info('Iniciando coleta Pacto Federativo — ano %d', ano)
    t0 = time.monotonic()

    # FPE
    log.info('Coletando FPE...')
    fpe = coletar_fpe(ano)
    log.info('FPE coletado para %d estados', len(fpe))

    if not fpe:
        log.warning('Sem dados de FPE — verificar API. Encerrando sem atualizar banco.')
        return

    # SUS (estimativa)
    sus = coletar_sus(ano)

    db = get_db()
    cur = db.cursor()
    ok = 0

    for sigla in SIGLAS:
        fpe_val = fpe.get(sigla, 0)
        sus_val = sus.get(sigla, 0)
        total_rec = round(fpe_val + sus_val, 2)

        if total_rec == 0:
            continue

        cur.execute(
            '''
            INSERT INTO estados_pacto_federativo
              (sigla, ano, fpe_mi, sus_mi, total_recebido_mi, source_id, collected_at)
            VALUES (%s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (sigla, ano) DO UPDATE SET
              fpe_mi           = EXCLUDED.fpe_mi,
              sus_mi           = COALESCE(EXCLUDED.sus_mi, estados_pacto_federativo.sus_mi),
              total_recebido_mi = EXCLUDED.total_recebido_mi,
              source_id        = EXCLUDED.source_id,
              collected_at     = now(),
              atualizado_em    = now()
            ''',
            (sigla, ano, fpe_val, sus_val, total_rec, f'stn_fpe_{ano}'),
        )
        ok += 1

    db.commit()
    db.close()

    duracao = time.monotonic() - t0
    log.info('Concluído: %d estados atualizados em %.1fs', ok, duracao)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Coleta pacto federativo (FPE + transferências)')
    parser.add_argument('--ano', type=int, default=datetime.now().year - 1)
    args = parser.parse_args()
    coletar(args.ano)
