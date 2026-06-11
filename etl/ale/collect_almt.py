"""
collect_almt.py — ETL da Assembleia Legislativa do Mato Grosso (ALMT)

API: https://api.al.mt.gov.br/
Autenticação: sem autenticação (pública)
Dados: deputados, votações, presenças, despesas

Uso:
    python -m etl.ale.collect_almt
    python -m etl.ale.collect_almt --entidade presencas --ano 2025
"""

import os
import requests
import argparse
import logging
import time
from datetime import date

from .base import (
    get_db, get_or_reconnect, get_json,
    buscar_mapa_deputados_uf, buscar_politico_por_nome,
    normalizar_voto, normalizar_justificativa, parse_data,
    registrar_coleta
)

log = logging.getLogger(__name__)

BASE_URL = 'https://api.al.mt.gov.br'
FONTE = 'almt'
UF = 'MT'
ANO_ATUAL = date.today().year
ANOS_PADRAO = [ANO_ATUAL - 1, ANO_ATUAL]


def get_almt_headers() -> dict:
    """
    Tenta obter o token de acesso OAuth 2.0 usando Client Credentials
    caso as credenciais estejam disponíveis no ambiente.
    """
    client_id = os.getenv('ALMT_CLIENT_ID')
    client_secret = os.getenv('ALMT_CLIENT_SECRET')
    headers = {'User-Agent': 'MeusPoliticosBR/1.0'}
    
    if not client_id or not client_secret:
        log.warning("[ALMT] ALMT_CLIENT_ID ou ALMT_CLIENT_SECRET não configurados. Continuando sem autenticação.")
        return headers

    try:
        token_url = f'{BASE_URL}/oauth/token'
        log.info(f"[ALMT] Solicitando token OAuth em {token_url}...")
        r = requests.post(
            token_url,
            data={'grant_type': 'client_credentials'},
            auth=(client_id, client_secret),
            timeout=15,
            verify=False
        )
        if r.status_code == 200:
            token = r.json().get('access_token')
            if token:
                headers['Authorization'] = f'Bearer {token}'
                log.info("[ALMT] Token OAuth 2.0 obtido com sucesso.")
        else:
            log.warning(f"[ALMT] Falha ao obter token: HTTP {r.status_code}. Continuando sem autenticação.")
    except Exception as e:
        log.warning(f"[ALMT] Erro ao obter token: {e}. Continuando sem autenticação.")

    return headers


# ──────────────────────────────────────────────────────────────────────────────
# Deputados
# ──────────────────────────────────────────────────────────────────────────────

def collect_deputados(conn, headers: dict) -> int:
    log.info("[ALMT] Coletando deputados...")
    dados = get_json(f'{BASE_URL}/deputados', headers=headers)
    if not dados:
        return 0

    itens = dados.get('data', dados.get('items', dados)) if isinstance(dados, dict) else dados
    total = 0

    with conn.cursor() as cur:
        for dep in itens:
            id_ale = str(dep.get('id') or dep.get('idDeputado') or '')
            nome = (dep.get('nome') or dep.get('nomeParlamentar') or '').strip()
            foto_url = dep.get('foto') or dep.get('urlFoto')
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

        conn.commit()

    log.info(f"[ALMT] {total} deputados atualizados")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Votações
# ──────────────────────────────────────────────────────────────────────────────

def collect_votacoes(conn, anos: list[int], headers: dict) -> int:
    log.info(f"[ALMT] Coletando votações para {anos}...")

    with conn.cursor() as cur:
        mapa = buscar_mapa_deputados_uf(cur, UF)

    total = 0

    for ano in anos:
        # ALMT organiza votações por sessão
        sessoes_data = get_json(f'{BASE_URL}/sessoes', params={'ano': ano}, headers=headers)
        if not sessoes_data:
            continue

        sessoes = sessoes_data.get('data', sessoes_data.get('items', sessoes_data)) if isinstance(sessoes_data, dict) else sessoes_data
        log.info(f"[ALMT] {ano}: {len(sessoes)} sessões")

        for sessao in sessoes:
            id_sessao = str(sessao.get('id') or '')
            if not id_sessao:
                continue

            data_str = sessao.get('data') or sessao.get('dataSessao') or ''
            data = parse_data(data_str)
            descricao_sessao = sessao.get('descricao') or sessao.get('tipo') or ''

            # Votações nominais da sessão
            vots_data = get_json(f'{BASE_URL}/sessoes/{id_sessao}/votacoes', headers=headers)
            if not vots_data:
                time.sleep(0.3)
                continue

            votacoes = vots_data.get('data', vots_data.get('items', vots_data)) if isinstance(vots_data, dict) else vots_data

            for votacao in votacoes:
                id_vot = str(votacao.get('id') or '')
                descricao = (votacao.get('descricao') or votacao.get('ementa') or descricao_sessao)[:500]
                proposicao_str = (votacao.get('proposicao') or votacao.get('sigla') or '')[:200]

                # Votos por parlamentar
                votos_data = get_json(f'{BASE_URL}/sessoes/{id_sessao}/votacoes/{id_vot}/votos', headers=headers)
                if not votos_data:
                    continue

                votos = votos_data.get('data', votos_data.get('items', votos_data)) if isinstance(votos_data, dict) else votos_data

                batch = []
                for voto in votos:
                    id_dep = str(voto.get('idDeputado') or voto.get('id') or '')
                    voto_raw = voto.get('voto') or voto.get('orientacao') or ''
                    voto_norm = normalizar_voto(str(voto_raw))
                    if not voto_norm:
                        continue

                    politico_id = mapa.get(id_dep)
                    if not politico_id:
                        nome = (voto.get('nome') or '').strip()
                        if nome:
                            with conn.cursor() as cur:
                                politico_id = buscar_politico_por_nome(cur, nome, UF)
                    if not politico_id:
                        continue

                    source_rec = f'{id_sessao}_{id_vot}_{id_dep}'
                    batch.append((
                        politico_id, data, voto_norm, descricao, proposicao_str,
                        f'{BASE_URL}/sessoes/{id_sessao}', FONTE, source_rec
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

    log.info(f"[ALMT] Total votações: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Presenças
# ──────────────────────────────────────────────────────────────────────────────

def collect_presencas(conn, anos: list[int], headers: dict) -> int:
    log.info(f"[ALMT] Coletando presenças para {anos}...")

    with conn.cursor() as cur:
        cur.execute("""
            SELECT id_ale, id FROM politicos
            WHERE cargo = 'deputado_estadual' AND uf = %s
              AND id_ale IS NOT NULL AND removido_em IS NULL
        """, (UF,))
        deputados = cur.fetchall()

    total = 0

    for id_ale, politico_id in deputados:
        for ano in anos:
            dados = get_json(f'{BASE_URL}/deputados/{id_ale}/presencas',
                              params={'ano': ano}, headers=headers)
            if not dados:
                # Tentar endpoint alternativo
                dados = get_json(f'{BASE_URL}/presencas',
                                  params={'ano': ano, 'idDeputado': id_ale}, headers=headers)
            if not dados:
                continue

            itens = dados.get('data', dados.get('items', dados)) if isinstance(dados, dict) else dados

            batch = []
            for s in itens:
                data_str = s.get('data') or s.get('dataSessao') or ''
                data = parse_data(data_str)
                if not data:
                    continue

                presente_raw = s.get('presente') or s.get('presenca') or s.get('situacao') or ''
                if isinstance(presente_raw, bool):
                    presente = presente_raw
                else:
                    presente = str(presente_raw).lower() in ('presente', 'sim', 'p', '1', 'true')

                justificativa = normalizar_justificativa(s.get('justificativa') or s.get('motivo'))
                tipo_sessao = 'plenario'
                tipo_raw = (s.get('tipo') or '').lower()
                if 'comiss' in tipo_raw:
                    tipo_sessao = 'comissao'

                id_sessao = str(s.get('idSessao') or s.get('id') or data_str)
                source_rec = f'{id_ale}_{ano}_{id_sessao}'

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

            time.sleep(0.4)

    log.info(f"[ALMT] Total presenças: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='ETL ALMT — Assembleia Legislativa do Mato Grosso')
    parser.add_argument('--entidade', choices=['deputados', 'votacoes', 'presencas', 'tudo'],
                        default='tudo')
    parser.add_argument('--ano', nargs='+', type=int, default=ANOS_PADRAO)
    args = parser.parse_args()

    conn = get_db()
    headers = get_almt_headers()
    try:
        totais = {}
        if args.entidade in ('deputados', 'tudo'):
            totais['deputados'] = collect_deputados(conn, headers)
        if args.entidade in ('votacoes', 'tudo'):
            totais['votacoes'] = collect_votacoes(conn, args.ano, headers)
        if args.entidade in ('presencas', 'tudo'):
            totais['presencas'] = collect_presencas(conn, args.ano, headers)

        with conn.cursor() as cur:
            for entidade, n in totais.items():
                registrar_coleta(cur, FONTE, entidade, n)
            conn.commit()

        log.info(f"[ALMT] Concluído: {totais}")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
