"""
collect_almg.py — ETL da Assembleia Legislativa de Minas Gerais (ALMG)

API: https://dadosabertos.almg.gov.br/api/v2/
Documentação: https://dadosabertos.almg.gov.br/
Dados: deputados, presenças, votações, despesas, proposições
Frequência sugerida: diária para presenças e votações, semanal para o resto

Uso:
    python -m etl.ale.collect_almg
    python -m etl.ale.collect_almg --entidade presencas --ano 2025
    python -m etl.ale.collect_almg --entidade votacoes --ano 2024 2025
"""

import argparse
import logging
import sys
import time
from datetime import date, datetime, timedelta

from .base import (
    get_db, get_or_reconnect, get_json,
    buscar_mapa_deputados_uf, buscar_politico_por_nome,
    normalizar_voto, normalizar_justificativa, parse_data,
    registrar_coleta
)

log = logging.getLogger(__name__)

BASE_URL = 'https://dadosabertos.almg.gov.br/api/v2'
FONTE = 'almg'
UF = 'MG'
ANO_ATUAL = date.today().year
ANOS_PADRAO = [ANO_ATUAL - 1, ANO_ATUAL]


# ──────────────────────────────────────────────────────────────────────────────
# Deputados
# ──────────────────────────────────────────────────────────────────────────────

def collect_deputados(conn) -> int:
    """
    Atualiza dados básicos dos deputados estaduais mineiros.
    Não cria novos políticos — apenas atualiza id_ale, foto, email
    em registros já existentes (criados via TSE 2022).
    """
    log.info("[ALMG] Coletando lista de deputados...")
    dados = get_json(f'{BASE_URL}/deputados/em_exercicio')
    if not dados:
        log.error("[ALMG] Falha ao buscar deputados")
        return 0

    # A API retorna {"list": [...]} ou lista direta dependendo da versão
    itens = dados.get('list', dados) if isinstance(dados, dict) else dados
    total = 0

    with conn.cursor() as cur:
        for dep in itens:
            id_ale = str(dep.get('id') or dep.get('idDeputado') or '')
            if not id_ale:
                continue

            nome = (dep.get('nomeParlamentar') or dep.get('nome') or '').strip()
            foto_url = dep.get('urlFoto') or dep.get('foto')
            email = dep.get('email')
            partido_sigla = (dep.get('partido') or dep.get('siglaPartido') or '').strip()

            # Tenta match por id_ale primeiro, depois por nome
            cur.execute("""
                SELECT id FROM politicos
                WHERE cargo = 'deputado_estadual' AND uf = %s
                  AND (id_ale = %s OR (nome_eleitoral ILIKE %s AND id_ale IS NULL))
                  AND removido_em IS NULL
                LIMIT 1
            """, (UF, id_ale, nome))
            row = cur.fetchone()
            if not row:
                log.debug(f"[ALMG] Deputado não encontrado no banco: {nome}")
                continue

            politico_id = row[0]
            cur.execute("""
                UPDATE politicos SET
                    id_ale   = COALESCE(id_ale, %s),
                    foto_url = COALESCE(foto_url, %s),
                    email    = COALESCE(email, %s),
                    atualizado_em = now()
                WHERE id = %s
            """, (id_ale, foto_url, email, politico_id))
            total += 1

        conn.commit()

    log.info(f"[ALMG] {total} deputados atualizados")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Presenças
# ──────────────────────────────────────────────────────────────────────────────

def collect_presencas(conn, anos: list[int]) -> int:
    """
    Coleta presenças em sessões plenárias por deputado por ano.
    Endpoint: GET /deputados/{id}/presenca?ano={ano}
    """
    log.info(f"[ALMG] Coletando presenças para anos {anos}...")

    with conn.cursor() as cur:
        cur.execute("""
            SELECT id_ale, id FROM politicos
            WHERE cargo = 'deputado_estadual' AND uf = %s
              AND id_ale IS NOT NULL AND removido_em IS NULL
        """, (UF,))
        deputados = cur.fetchall()

    if not deputados:
        log.warning("[ALMG] Nenhum deputado com id_ale encontrado. Rode collect_deputados primeiro.")
        return 0

    total = 0

    for id_ale, politico_id in deputados:
        for ano in anos:
            url = f'{BASE_URL}/deputados/{id_ale}/presenca'
            dados = get_json(url, params={'ano': ano})
            if not dados:
                continue

            sessoes = dados.get('list', dados) if isinstance(dados, dict) else dados

            registros_batch = []
            for s in sessoes:
                data_str = s.get('data') or s.get('dataReuniao') or s.get('dataSessao')
                data = parse_data(data_str)
                if not data:
                    continue

                presente_raw = s.get('presenca') or s.get('presente') or s.get('situacao') or ''
                if isinstance(presente_raw, bool):
                    presente = presente_raw
                else:
                    presente_raw_lower = str(presente_raw).lower()
                    presente = presente_raw_lower in ('presente', 'sim', 'yes', 'p', '1', 'true')
                    if presente_raw_lower in ('ausente', 'nao', 'no', 'a', '0', 'false', ''):
                        presente = False

                justificativa_raw = s.get('justificativa') or s.get('motivoAusencia')
                justificativa = normalizar_justificativa(justificativa_raw)

                tipo_sessao = 'plenario'
                tipo_raw = (s.get('tipoSessao') or s.get('tipo') or '').lower()
                if 'comiss' in tipo_raw:
                    tipo_sessao = 'comissao'
                elif 'extraordi' in tipo_raw:
                    tipo_sessao = 'extraordinaria'

                id_sessao_ext = str(s.get('idReuniao') or s.get('idSessao') or s.get('id') or '')
                source_record = f'{id_ale}_{ano}_{id_sessao_ext or data_str}'

                registros_batch.append((
                    politico_id, data, UF, tipo_sessao, presente, justificativa,
                    FONTE, FONTE, source_record
                ))

            if registros_batch:
                with conn.cursor() as cur:
                    cur.executemany("""
                        INSERT INTO ale_presencas
                            (politico_id, data, uf, tipo_sessao, presente, justificativa,
                             fonte, source_id, source_record_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (source_id, source_record_id) DO UPDATE SET
                            presente      = EXCLUDED.presente,
                            justificativa = EXCLUDED.justificativa
                    """, registros_batch)
                    conn.commit()
                    total += len(registros_batch)
                    log.info(f"[ALMG] Deputado {id_ale} / {ano}: {len(registros_batch)} presenças")

            time.sleep(0.3)  # gentileza com a API

    log.info(f"[ALMG] Total presenças inseridas/atualizadas: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Votações
# ──────────────────────────────────────────────────────────────────────────────

def collect_votacoes(conn, anos: list[int]) -> int:
    """
    Coleta votações nominais do plenário.
    Endpoint: GET /plenario/reunioes?dataInicio=YYYY-01-01&dataFim=YYYY-12-31
    Depois: GET /plenario/reunioes/{id}/votacoes/{voteId}/votos
    """
    log.info(f"[ALMG] Coletando votações para anos {anos}...")

    with conn.cursor() as cur:
        mapa = buscar_mapa_deputados_uf(cur, UF)

    if not mapa:
        log.warning("[ALMG] Nenhum deputado MG mapeado")
        return 0

    total = 0

    for ano in anos:
        data_inicio = f'{ano}-01-01'
        data_fim = f'{ano}-12-31'

        # Listar reuniões do ano
        reunioes_data = get_json(f'{BASE_URL}/plenario/reunioes',
                                  params={'dataInicio': data_inicio, 'dataFim': data_fim})
        if not reunioes_data:
            continue

        reunioes = reunioes_data.get('list', reunioes_data) if isinstance(reunioes_data, dict) else reunioes_data
        log.info(f"[ALMG] {ano}: {len(reunioes)} reuniões encontradas")

        for reuniao in reunioes:
            id_reuniao = str(reuniao.get('id') or reuniao.get('idReuniao') or '')
            if not id_reuniao:
                continue

            data_str = reuniao.get('data') or reuniao.get('dataReuniao') or ''
            data = parse_data(data_str)
            descricao_sessao = reuniao.get('nome') or reuniao.get('descricao') or f'Reunião {id_reuniao}'

            # Buscar votações da reunião
            vots_data = get_json(f'{BASE_URL}/plenario/reunioes/{id_reuniao}/votacoes')
            if not vots_data:
                continue

            votacoes = vots_data.get('list', vots_data) if isinstance(vots_data, dict) else vots_data

            for votacao in votacoes:
                id_votacao = str(votacao.get('id') or votacao.get('idVotacao') or '')
                if not id_votacao:
                    continue

                descricao_vot = votacao.get('descricao') or votacao.get('ementa') or ''
                proposicao_str = votacao.get('siglaProposicao') or votacao.get('proposicao') or ''

                # Buscar votos nominais
                votos_data = get_json(f'{BASE_URL}/plenario/reunioes/{id_reuniao}/votacoes/{id_votacao}/votos')
                if not votos_data:
                    continue

                votos = votos_data.get('list', votos_data) if isinstance(votos_data, dict) else votos_data

                batch = []
                for voto in votos:
                    id_dep_ale = str(voto.get('idDeputado') or voto.get('id') or '')
                    voto_raw = voto.get('voto') or voto.get('orientacao') or ''
                    voto_norm = normalizar_voto(str(voto_raw))
                    if not voto_norm:
                        continue

                    politico_id = mapa.get(id_dep_ale)
                    if not politico_id:
                        continue

                    source_rec = f'{id_reuniao}_{id_votacao}_{id_dep_ale}'
                    batch.append((
                        politico_id, data, voto_norm,
                        (descricao_sessao + ' — ' + descricao_vot)[:500],
                        proposicao_str[:200],
                        f'{BASE_URL}/plenario/reunioes/{id_reuniao}',
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

                time.sleep(0.2)

        log.info(f"[ALMG] {ano}: {total} votos acumulados")

    log.info(f"[ALMG] Total votações inseridas/atualizadas: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Despesas (Verba Indenizatória)
# ──────────────────────────────────────────────────────────────────────────────

def collect_despesas(conn, anos: list[int]) -> int:
    """
    Coleta despesas da verba indenizatória (equivalente à CEAP).
    Endpoint: GET /deputados/{id}/verba-indenizatoria?ano={ano}&mes={mes}
    """
    log.info(f"[ALMG] Coletando despesas para anos {anos}...")

    with conn.cursor() as cur:
        cur.execute("""
            SELECT id_ale, id FROM politicos
            WHERE cargo = 'deputado_estadual' AND uf = %s
              AND id_ale IS NOT NULL AND removido_em IS NULL
        """, (UF,))
        deputados = cur.fetchall()

    if not deputados:
        return 0

    total = 0
    meses = range(1, 13)

    for id_ale, politico_id in deputados:
        for ano in anos:
            for mes in meses:
                # Não buscar meses futuros
                if date(ano, mes, 1) > date.today().replace(day=1):
                    break

                url = f'{BASE_URL}/prestacao_contas/verbas_indenizatorias/deputados/{id_ale}/{ano}/{mes}'
                dados = get_json(url)
                if not dados:
                    continue

                itens = dados.get('list', dados) if isinstance(dados, dict) else dados

                batch = []
                for item in itens:
                    detalhes = item.get('listaDetalheVerba') or [item]
                    for det in detalhes:
                        valor_str = str(det.get('valor') or det.get('valorTotal') or det.get('valorReembolsado') or '0')
                        try:
                            valor = float(valor_str.replace(',', '.').replace('R$', '').strip())
                        except ValueError:
                            continue
                        if valor <= 0:
                            continue

                        categoria_raw = det.get('descTipoDespesa') or det.get('descritivoNatureza') or det.get('natureza') or det.get('categoria') or det.get('tipo') or 'outros'
                        fornecedor = (det.get('nomeEmitente') or det.get('fornecedor') or det.get('empresa') or '')[:200]
                        cnpj = (det.get('cnpjEmitente') or det.get('cnpj') or det.get('cpfCnpj') or '')[:20]
                        id_item = str(det.get('id') or det.get('idDespesa') or '')
                        source_rec = f'{id_ale}_{ano}_{mes}_{id_item}'

                        batch.append((
                            politico_id, ano, mes, valor,
                            categoria_raw[:100], fornecedor, cnpj or None,
                            FONTE, source_rec
                        ))

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

                time.sleep(0.2)

    log.info(f"[ALMG] Total despesas inseridas/atualizadas: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Proposições
# ──────────────────────────────────────────────────────────────────────────────

def collect_proposicoes(conn, anos: list[int]) -> int:
    """
    Coleta proposições apresentadas por deputados mineiros.
    Endpoint: GET /proposicoes?ano={ano}&tipoProposta={tipo}
    """
    log.info(f"[ALMG] Coletando proposições para anos {anos}...")

    tipos = ['PL', 'PEC', 'PDL', 'PLB', 'MOC', 'INC']

    with conn.cursor() as cur:
        mapa = buscar_mapa_deputados_uf(cur, UF)

    total = 0

    for ano in anos:
        for tipo in tipos:
            pagina = 1
            while True:
                dados = get_json(f'{BASE_URL}/proposicoes',
                                  params={'ano': ano, 'tipoProposta': tipo, 'p': pagina, 'tp': 50})
                if not dados:
                    break

                itens = dados.get('list', dados) if isinstance(dados, dict) else dados
                if not itens:
                    break

                batch_props = []
                for prop in itens:
                    numero = str(prop.get('numero') or prop.get('numProposicao') or '')
                    ementa = (prop.get('ementa') or prop.get('descricao') or '')[:1000]
                    situacao = (prop.get('situacao') or prop.get('statusAtual') or '')[:200]
                    data_str = prop.get('dataApresentacao') or prop.get('data')
                    data_apres = parse_data(data_str)
                    id_ext = str(prop.get('id') or prop.get('idProposicao') or '')

                    source_rec = f'almg_{tipo}_{ano}_{numero or id_ext}'
                    batch_props.append((
                        id_ext, tipo, numero, ano, ementa, situacao,
                        data_apres, 'almg', FONTE, source_rec
                    ))

                if batch_props:
                    with conn.cursor() as cur:
                        cur.executemany("""
                            INSERT INTO proposicoes
                                (id_externo_ale, tipo, numero, ano, ementa, situacao,
                                 data_apresentacao, casa_origem, source_id, source_record_id)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (source_id, source_record_id) DO UPDATE SET
                                situacao = EXCLUDED.situacao
                        """, batch_props)
                        conn.commit()
                        total += len(batch_props)

                if len(itens) < 50:
                    break
                pagina += 1
                time.sleep(0.3)

    log.info(f"[ALMG] Total proposições inseridas/atualizadas: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='ETL ALMG — Assembleia Legislativa de Minas Gerais')
    parser.add_argument('--entidade', choices=['deputados', 'presencas', 'votacoes', 'despesas', 'proposicoes', 'tudo'],
                        default='tudo', help='Entidade a coletar')
    parser.add_argument('--ano', nargs='+', type=int, default=ANOS_PADRAO,
                        help=f'Ano(s) (padrão: {ANOS_PADRAO})')
    args = parser.parse_args()

    conn = get_db()
    try:
        totais = {}
        if args.entidade in ('deputados', 'tudo'):
            totais['deputados'] = collect_deputados(conn)
        if args.entidade in ('presencas', 'tudo'):
            totais['presencas'] = collect_presencas(conn, args.ano)
        if args.entidade in ('votacoes', 'tudo'):
            totais['votacoes'] = collect_votacoes(conn, args.ano)
        if args.entidade in ('despesas', 'tudo'):
            totais['despesas'] = collect_despesas(conn, args.ano)
        if args.entidade in ('proposicoes', 'tudo'):
            totais['proposicoes'] = collect_proposicoes(conn, args.ano)

        with conn.cursor() as cur:
            for entidade, n in totais.items():
                registrar_coleta(cur, FONTE, entidade, n)
            conn.commit()

        log.info(f"[ALMG] Concluído: {totais}")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
