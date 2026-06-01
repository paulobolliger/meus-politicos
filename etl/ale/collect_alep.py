"""
collect_alep.py — ETL da Assembleia Legislativa do Paraná (ALEP)

API: http://webservices.assembleia.pr.leg.br/api/public
Documentação: https://www.assembleia.pr.leg.br/dados-abertos
Dados: parlamentares, votações, proposições, presenças

Uso:
    python -m etl.ale.collect_alep
    python -m etl.ale.collect_alep --entidade presencas --ano 2025
"""

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

BASE_URL = 'http://webservices.assembleia.pr.leg.br/api/public'
FONTE = 'alep'
UF = 'PR'
ANO_ATUAL = date.today().year
ANOS_PADRAO = [ANO_ATUAL - 1, ANO_ATUAL]


# ──────────────────────────────────────────────────────────────────────────────
# Parlamentares
# ──────────────────────────────────────────────────────────────────────────────

def collect_parlamentares(conn) -> int:
    """
    Atualiza id_ale dos deputados paranaenses.
    GET /parlamentar → lista com id, nome, partido, foto, email
    """
    log.info("[ALEP] Coletando parlamentares...")
    dados = get_json(f'{BASE_URL}/parlamentar')
    if not dados:
        log.error("[ALEP] Falha ao buscar parlamentares")
        return 0

    itens = dados.get('data', dados.get('list', dados)) if isinstance(dados, dict) else dados
    total = 0

    with conn.cursor() as cur:
        for dep in itens:
            id_ale = str(dep.get('id') or dep.get('idParlamentar') or '')
            nome = (dep.get('nome') or dep.get('nomeParlamentar') or '').strip()
            foto_url = dep.get('foto') or dep.get('urlFoto')
            email = dep.get('email')

            if not id_ale or not nome:
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

    log.info(f"[ALEP] {total} parlamentares atualizados")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Votações
# ──────────────────────────────────────────────────────────────────────────────

def collect_votacoes(conn, anos: list[int]) -> int:
    """
    GET /votacao?ano={ano} → lista de votações
    Para cada votação: GET /votacao/{id}/votos → votos nominais
    """
    log.info(f"[ALEP] Coletando votações para {anos}...")

    with conn.cursor() as cur:
        mapa = buscar_mapa_deputados_uf(cur, UF)

    total = 0

    for ano in anos:
        pagina = 1
        while True:
            dados = get_json(f'{BASE_URL}/votacao',
                              params={'ano': ano, 'pagina': pagina, 'quantidade': 100})
            if not dados:
                break

            itens = dados.get('data', dados.get('list', dados)) if isinstance(dados, dict) else dados
            if not itens:
                break

            for votacao in itens:
                id_vot = str(votacao.get('id') or votacao.get('idVotacao') or '')
                data_str = votacao.get('data') or votacao.get('dataVotacao') or ''
                data = parse_data(data_str)
                descricao = (votacao.get('descricao') or votacao.get('ementa') or '')[:500]
                proposicao_str = (votacao.get('proposicao') or votacao.get('sigla') or '')[:200]

                # Buscar votos nominais
                votos_dados = get_json(f'{BASE_URL}/votacao/{id_vot}/votos')
                if not votos_dados:
                    time.sleep(0.3)
                    continue

                votos_list = votos_dados.get('data', votos_dados.get('list', votos_dados)) if isinstance(votos_dados, dict) else votos_dados

                batch = []
                for voto in votos_list:
                    id_dep = str(voto.get('idParlamentar') or voto.get('id') or '')
                    voto_raw = voto.get('voto') or voto.get('orientacao') or ''
                    voto_norm = normalizar_voto(str(voto_raw))
                    if not voto_norm:
                        continue

                    politico_id = mapa.get(id_dep)
                    if not politico_id:
                        # Tentar por nome
                        nome = (voto.get('nome') or voto.get('nomeParlamentar') or '').strip()
                        if nome:
                            with conn.cursor() as cur:
                                politico_id = buscar_politico_por_nome(cur, nome, UF)
                    if not politico_id:
                        continue

                    source_rec = f'{id_vot}_{id_dep}'
                    batch.append((
                        politico_id, data, voto_norm, descricao, proposicao_str,
                        f'{BASE_URL}/votacao/{id_vot}',
                        FONTE, source_rec
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

                time.sleep(0.3)

            proxima = dados.get('proximaPagina') if isinstance(dados, dict) else None
            if not proxima or len(itens) < 100:
                break
            pagina += 1

    log.info(f"[ALEP] Total votações: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Presenças
# ──────────────────────────────────────────────────────────────────────────────

def collect_presencas(conn, anos: list[int]) -> int:
    """
    GET /presenca?ano={ano}&idParlamentar={id} ou
    GET /presenca?ano={ano} → todas de uma vez
    """
    log.info(f"[ALEP] Coletando presenças para {anos}...")

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
            dados = get_json(f'{BASE_URL}/presenca',
                              params={'ano': ano, 'idParlamentar': id_ale})
            if not dados:
                continue

            itens = dados.get('data', dados.get('list', dados)) if isinstance(dados, dict) else dados

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
                tipo_raw = (s.get('tipo') or s.get('tipoSessao') or '').lower()
                if 'comiss' in tipo_raw:
                    tipo_sessao = 'comissao'

                id_sessao = str(s.get('id') or s.get('idSessao') or s.get('numero') or data_str)
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

            time.sleep(0.3)

    log.info(f"[ALEP] Total presenças: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Proposições
# ──────────────────────────────────────────────────────────────────────────────

def collect_proposicoes(conn, anos: list[int]) -> int:
    """
    GET /proposicao/campos?ano={ano} → lista de proposições com metadados
    """
    log.info(f"[ALEP] Coletando proposições para {anos}...")
    total = 0

    for ano in anos:
        dados = get_json(f'{BASE_URL}/proposicao/campos', params={'ano': ano})
        if not dados:
            continue

        itens = dados.get('data', dados.get('list', dados)) if isinstance(dados, dict) else dados

        batch = []
        for prop in itens:
            if not isinstance(prop, dict):
                continue
            tipo = (prop.get('tipo') or prop.get('sigla') or 'PL')[:20]
            numero = str(prop.get('numero') or prop.get('num') or '')
            ementa = (prop.get('ementa') or prop.get('descricao') or '')[:1000]
            situacao = (prop.get('situacao') or prop.get('status') or '')[:200]
            data_apres = parse_data(prop.get('dataApresentacao') or prop.get('data'))
            id_ext = str(prop.get('id') or prop.get('idProposicao') or '')
            source_rec = f'alep_{tipo}_{ano}_{numero or id_ext}'

            batch.append((
                id_ext, tipo, numero, ano, ementa, situacao,
                data_apres, 'alep', FONTE, source_rec
            ))

        if batch:
            with conn.cursor() as cur:
                cur.executemany("""
                    INSERT INTO proposicoes
                        (id_externo_ale, tipo, numero, ano, ementa, situacao,
                         data_apresentacao, casa_origem, source_id, source_record_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (source_id, source_record_id) DO UPDATE SET
                        situacao = EXCLUDED.situacao
                """, batch)
                conn.commit()
                total += len(batch)

    log.info(f"[ALEP] Total proposições: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='ETL ALEP — Assembleia Legislativa do Paraná')
    parser.add_argument('--entidade', choices=['parlamentares', 'votacoes', 'presencas', 'proposicoes', 'tudo'],
                        default='tudo')
    parser.add_argument('--ano', nargs='+', type=int, default=ANOS_PADRAO)
    args = parser.parse_args()

    conn = get_db()
    try:
        totais = {}
        if args.entidade in ('parlamentares', 'tudo'):
            totais['parlamentares'] = collect_parlamentares(conn)
        if args.entidade in ('votacoes', 'tudo'):
            totais['votacoes'] = collect_votacoes(conn, args.ano)
        if args.entidade in ('presencas', 'tudo'):
            totais['presencas'] = collect_presencas(conn, args.ano)
        if args.entidade in ('proposicoes', 'tudo'):
            totais['proposicoes'] = collect_proposicoes(conn, args.ano)

        with conn.cursor() as cur:
            for entidade, n in totais.items():
                registrar_coleta(cur, FONTE, entidade, n)
            conn.commit()

        log.info(f"[ALEP] Concluído: {totais}")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
