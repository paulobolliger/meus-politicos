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

BASE_URL = 'https://transparencia.assembleia.pr.leg.br/api'
FONTE = 'alep'
UF = 'PR'
ANO_ATUAL = date.today().year
ANOS_PADRAO = [ANO_ATUAL - 1, ANO_ATUAL]


# ──────────────────────────────────────────────────────────────────────────────
# Parlamentares
# ──────────────────────────────────────────────────────────────────────────────

def get_alep_headers(referer_path=''):
    return {
        'Referer': f'https://transparencia.assembleia.pr.leg.br/{referer_path}',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
    }


# ──────────────────────────────────────────────────────────────────────────────
# Parlamentares
# ──────────────────────────────────────────────────────────────────────────────

def collect_parlamentares(conn) -> int:
    """
    O endpoint de parlamentares não está disponível na API de Transparência.
    O mapeamento será feito por nome na coleta de presenças e votações.
    """
    log.info("[ALEP] O endpoint de parlamentares não está disponível na API de Transparência. O mapeamento será realizado por nome nas coletas de presenças e votações.")
    return 0


# ──────────────────────────────────────────────────────────────────────────────
# Votações
# ──────────────────────────────────────────────────────────────────────────────

def collect_votacoes(conn, anos: list[int]) -> int:
    """
    Coleta votações (itens votados) e insere na tabela proposicoes.
    Varre anos -> meses -> dias com sessão -> chamada diária de sessões -> chamada de votações por sessão.
    """
    log.info(f"[ALEP] Coletando votações para {anos}...")
    headers = get_alep_headers('plenario/controle-de-votacao')

    total = 0

    for ano in anos:
        # 1. Obter meses
        meses_dados = get_json(f'{BASE_URL}/presenca/meses', params={'ano': ano}, headers=headers)
        if not meses_dados or not isinstance(meses_dados, dict) or not meses_dados.get('meses'):
            continue

        meses = meses_dados['meses']

        for mes_str in meses.keys():
            mes = int(mes_str)

            # 2. Obter datas de sessão
            datas_dados = get_json(f'{BASE_URL}/presenca/datas', params={'ano': ano, 'mes': mes}, headers=headers)
            if not datas_dados or not isinstance(datas_dados, list):
                continue

            for dia_str in datas_dados:
                dia = int(dia_str)
                data_sessao = date(ano, mes, dia)

                # 3. Obter sessões de votação do dia
                sessoes_dados = get_json(
                    f'{BASE_URL}/votacoes/sessoes',
                    params={'ano': ano, 'mes': mes, 'data': dia},
                    headers=headers
                )
                if not sessoes_dados or not isinstance(sessoes_dados, dict):
                    continue

                for sessao_id, sessao_nome in sessoes_dados.items():
                    # 4. Obter itens votados na sessão
                    itens_dados = get_json(
                        f'{BASE_URL}/votacoes',
                        params={'ano': ano, 'mes': mes, 'data': dia, 'sessao': sessao_id},
                        headers=headers
                    )
                    if not itens_dados or not isinstance(itens_dados, list):
                        continue

                    batch = []
                    for idx, item_obj in enumerate(itens_dados):
                        if not isinstance(item_obj, dict):
                            continue
                        
                        item_text = (item_obj.get('item') or '').strip()
                        if not item_text:
                            continue

                        arquivo_pdf = (item_obj.get('arquivo') or '').strip() or None

                        # Parser do tipo e número do projeto a partir do texto
                        import re
                        tipo = 'Outros'
                        numero = ''
                        
                        # Exemplos: PROJETO DE LEI N°514/2025, PROJETO DE LEI COMPLEMENTAR N° 12/2026
                        match_prop = re.search(
                            r'(PROJETO DE LEI COMPLEMENTAR|PROJETO DE LEI|PROJETO DE RESOLUÇÃO|PROJETO DE DECRETO LEGISLATIVO|PROJETO DE EMENDA À CONSTITUIÇÃO)\s*(?:N[°ºªo]?\s*)?(\d+/\d+)',
                            item_text, re.IGNORECASE
                        )
                        if match_prop:
                            prop_nome = match_prop.group(1).upper()
                            numero = match_prop.group(2)
                            if 'COMPLEMENTAR' in prop_nome:
                                tipo = 'PLC'
                            elif 'RESOLUÇÃO' in prop_nome:
                                tipo = 'PR'
                            elif 'DECRETO' in prop_nome:
                                tipo = 'PDL'
                            elif 'EMENDA' in prop_nome:
                                tipo = 'PEC'
                            else:
                                tipo = 'PL'
                        else:
                            # Fallback simples
                            match_num = re.search(r'(?:N[°ºªo]?\s*)?(\d+/\d+)', item_text)
                            if match_num:
                                numero = match_num.group(1)
                                tipo = 'PL'
                            else:
                                # Fallback se não achar número
                                tipo = 'SESSÃO'
                                numero = f'{sessao_id}-{idx}'

                        ementa = item_text
                        situacao = 'Votado'
                        # Verificar se tem situação no final entre parênteses
                        match_sit = re.search(r'\(([^)]+)\)$', item_text)
                        if match_sit:
                            situacao = match_sit.group(1).strip()

                        # Inserir no banco em proposicoes
                        id_ext = arquivo_pdf or f'{sessao_id}_{idx}'
                        source_rec = f'alep_vot_item_{sessao_id}_{idx}'

                        batch.append((
                            id_ext, tipo, numero, ano, ementa, situacao,
                            data_sessao, 'alep', FONTE, source_rec
                        ))

                    if batch:
                        with conn.cursor() as cur:
                            cur.executemany("""
                                INSERT INTO proposicoes
                                    (id_externo_ale, tipo, numero, ano, ementa, situacao,
                                     data_apresentacao, casa_origem, source_id, source_record_id)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                ON CONFLICT (source_id, source_record_id) DO UPDATE SET
                                    situacao = EXCLUDED.situacao,
                                    id_externo_ale = EXCLUDED.id_externo_ale
                            """, batch)
                        conn.commit()
                        total += len(batch)

                    time.sleep(0.3)

    log.info(f"[ALEP] Total votações: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Presenças
# ──────────────────────────────────────────────────────────────────────────────

def collect_presencas(conn, anos: list[int]) -> int:
    """
    Coleta presenças utilizando a API de Transparência do Paraná.
    Varre ano -> meses -> dias com sessão -> chamada diária (matrix format).
    """
    log.info(f"[ALEP] Coletando presenças para {anos}...")
    headers = {
        'Referer': 'https://transparencia.assembleia.pr.leg.br/plenario/presenca-em-plenario',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
    }

    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, nome_eleitoral, nome FROM politicos
            WHERE cargo = 'deputado_estadual' AND uf = %s AND removido_em IS NULL
        """, (UF,))
        deputados_db = cur.fetchall()

    from unidecode import unidecode
    mapa_nomes = {}
    for uuid, nome_el, nome_c in deputados_db:
        if nome_el:
            mapa_nomes[unidecode(nome_el).lower().strip()] = uuid
        if nome_c:
            mapa_nomes[unidecode(nome_c).lower().strip()] = uuid

    total = 0

    for ano in anos:
        # 1. Obter meses
        meses_dados = get_json(f'{BASE_URL}/presenca/meses', params={'ano': ano}, headers=headers)
        if not meses_dados or not isinstance(meses_dados, dict) or not meses_dados.get('meses'):
            continue

        meses = meses_dados['meses']

        for mes_str in meses.keys():
            mes = int(mes_str)

            # 2. Obter datas
            datas_dados = get_json(f'{BASE_URL}/presenca/datas', params={'ano': ano, 'mes': mes}, headers=headers)
            if not datas_dados or not isinstance(datas_dados, list):
                continue

            for dia_str in datas_dados:
                dia = int(dia_str)
                data_sessao = date(ano, mes, dia)

                # 3. Obter presenças do dia
                dados_dia = get_json(f'{BASE_URL}/presenca', params={'ano': ano, 'mes': mes, 'data': dia}, headers=headers)
                if not dados_dia or not isinstance(dados_dia, list) or len(dados_dia) < 2:
                    continue

                header = [h.upper() for h in dados_dia[0]]
                if "PRESENTES" not in header:
                    continue

                col_pres = header.index("PRESENTES")
                col_just = header.index("JUSTIFICADOS") if "JUSTIFICADOS" in header else -1
                col_aus = header.index("AUSENTES") if "AUSENTES" in header else -1

                batch = []
                for row in dados_dia[1:]:
                    # Presentes
                    if col_pres < len(row) and row[col_pres]:
                        nome = row[col_pres].strip()
                        politico_id = mapa_nomes.get(unidecode(nome).lower())
                        if politico_id:
                            source_rec = f"alep_pres_{ano}_{mes}_{dia}_{unidecode(nome)[:15].replace(' ', '_').lower()}"
                            batch.append((
                                politico_id, data_sessao, UF, 'plenario', True, None,
                                FONTE, FONTE, source_rec
                            ))

                    # Justificados
                    if col_just >= 0 and col_just < len(row) and row[col_just]:
                        raw_just = row[col_just].strip()
                        import re
                        m = re.match(r'^([^(]+)(?:\(([^)]+)\))?', raw_just)
                        if m:
                            nome = m.group(1).strip()
                            just = m.group(2).strip() if m.group(2) else "justificado"
                            politico_id = mapa_nomes.get(unidecode(nome).lower())
                            if politico_id:
                                source_rec = f"alep_pres_{ano}_{mes}_{dia}_{unidecode(nome)[:15].replace(' ', '_').lower()}"
                                batch.append((
                                    politico_id, data_sessao, UF, 'plenario', False, just[:200],
                                    FONTE, FONTE, source_rec
                                ))

                    # Ausentes
                    if col_aus >= 0 and col_aus < len(row) and row[col_aus]:
                        nome = row[col_aus].strip()
                        politico_id = mapa_nomes.get(unidecode(nome).lower())
                        if politico_id:
                            source_rec = f"alep_pres_{ano}_{mes}_{dia}_{unidecode(nome)[:15].replace(' ', '_').lower()}"
                            batch.append((
                                politico_id, data_sessao, UF, 'plenario', False, None,
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
    headers = get_alep_headers('servicos/dados-abertos')
    total = 0

    for ano in anos:
        dados = get_json(f'{BASE_URL}/proposicao/campos', params={'ano': ano}, headers=headers)
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
