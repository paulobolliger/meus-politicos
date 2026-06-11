"""
collect_alba.py — ETL da Assembleia Legislativa da Bahia (ALBA)

API REST: https://albalegis.nopapercloud.com.br/api/publico/
Endpoints:
  - /api/publico/parlamentar/?pg=1&qtd=100
  - /api/publico/comissoes/

Uso:
    python -m etl.ale.collect_alba
"""

import argparse
import logging
import urllib3
import requests

from .base import (
    get_db, buscar_politico_por_nome, registrar_coleta
)

# Desativar avisos de SSL não confiável
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

log = logging.getLogger(__name__)

BASE_URL = 'https://albalegis.nopapercloud.com.br/api/publico'
FONTE = 'alba'
UF = 'BA'


def collect_deputados(conn) -> int:
    """
    Coleta os deputados da ALBA. Tenta a API de parlamentares.
    Em caso de falha/timeout, utiliza a API de comissões como fallback.
    """
    log.info("[ALBA] Coletando deputados...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    deputados_coletados = {}  # id_ale -> {nome, foto_url, email}

    # 1. Tentar parlamentar endpoint
    try:
        url = f'{BASE_URL}/parlamentar/?pg=1&qtd=100'
        log.info(f"[ALBA] Buscando parlamentares em {url}...")
        r = requests.get(url, headers=headers, verify=False, timeout=15)
        if r.status_code == 200:
            dados = r.json()
            # Tratar retorno
            itens = []
            if isinstance(dados, list):
                itens = dados
            elif isinstance(dados, dict):
                itens = dados.get('parlamentares', dados.get('data', dados.get('list', [])))

            for item in itens:
                id_ale = str(item.get('parlamentarID') or item.get('id') or '')
                nome = (item.get('parlamentarRazaoSocial') or item.get('nome') or '').strip()
                foto = (item.get('parlamentarFoto') or item.get('foto') or '').strip() or None
                email = (item.get('parlamentarEmail') or item.get('email') or '').strip() or None

                if id_ale and nome:
                    deputados_coletados[id_ale] = {
                        'nome': nome,
                        'foto_url': foto,
                        'email': email
                    }
            log.info(f"[ALBA] {len(deputados_coletados)} deputados obtidos via parlamentar endpoint.")
    except Exception as e:
        log.warning(f"[ALBA] Falha ou timeout no endpoint de parlamentares: {e}. Usando fallback...")

    # 2. Fallback via comissões se não obtivemos nada ou poucos deputados
    if len(deputados_coletados) < 10:
        try:
            url = f'{BASE_URL}/comissoes/'
            log.info(f"[ALBA] Fallback: Buscando deputados através de comissões em {url}...")
            r = requests.get(url, headers=headers, verify=False, timeout=15)
            if r.status_code == 200:
                dados = r.json()
                comissoes = dados.get('comissoes', []) if isinstance(dados, dict) else []
                for com in comissoes:
                    membros = com.get('comissaoParlamentar', [])
                    for memb in membros:
                        id_ale = str(memb.get('parlamentarID') or '')
                        nome = (memb.get('parlamentarRazaoSocial') or '').strip()
                        foto = (memb.get('parlamentarFoto') or '').strip() or None
                        
                        if id_ale and nome and id_ale not in deputados_coletados:
                            deputados_coletados[id_ale] = {
                                'nome': nome,
                                'foto_url': foto,
                                'email': None
                            }
                log.info(f"[ALBA] Fallback concluído. Total de deputados mapeados: {len(deputados_coletados)}")
        except Exception as e:
            log.error(f"[ALBA] Falha crítica ao buscar comissões: {e}")

    if not deputados_coletados:
        log.error("[ALBA] Nenhum deputado pôde ser coletado.")
        return 0

    total = 0
    with conn.cursor() as cur:
        for id_ale, info in deputados_coletados.items():
            nome = info['nome']
            foto_url = info['foto_url']
            email = info['email']

            cur.execute("""
                UPDATE politicos SET
                    id_ale    = COALESCE(id_ale, %s),
                    foto_url  = COALESCE(foto_url, %s),
                    email     = COALESCE(email, %s),
                    atualizado_em = now()
                WHERE cargo = 'deputado_estadual' AND uf = %s
                  AND (id_ale = %s OR nome_eleitoral ILIKE %s OR nome ILIKE %s)
                  AND removido_em IS NULL
            """, (id_ale, foto_url, email, UF, id_ale, nome, nome))

            if cur.rowcount > 0:
                total += 1

        conn.commit()

    log.info(f"[ALBA] {total} deputados atualizados no banco de dados.")
    return total


def main():
    parser = argparse.ArgumentParser(description='ETL ALBA — Assembleia Legislativa da Bahia')
    parser.add_argument('--entidade', choices=['deputados', 'tudo'], default='tudo')
    args = parser.parse_args()

    conn = get_db()
    try:
        totais = {}
        if args.entidade in ('deputados', 'tudo'):
            totais['deputados'] = collect_deputados(conn)

        with conn.cursor() as cur:
            for entidade, n in totais.items():
                registrar_coleta(cur, FONTE, entidade, n)
            conn.commit()

        log.info(f"[ALBA] Concluído com sucesso: {totais}")
    finally:
        conn.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    main()
