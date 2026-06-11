"""
collect_sapl.py — ETL genérico para ALEs que usam SAPL

SAPL (Sistema de Apoio ao Processo Legislativo) é o sistema
usado por ~15 ALEs. Expõe dados via JSON REST em:
  https://{dominio}/api/

Estados confirmados com SAPL público:
  AC → https://sapl.al.ac.leg.br/api/
  AM → https://sapl.al.am.leg.br/api/
  RR → https://sapl.al.rr.leg.br/api/
  PI → https://sapl.pi.leg.br/api/

Dados disponíveis via SAPL:
  - /parlamentar/parlamentar/  → lista de parlamentares
  - /sessao/sessaoplenaria/    → sessões plenárias
  - /sessao/registrovotacao/   → votações registradas
  - /sessao/expedientemateria/ → matérias em pauta

Uso:
    python -m etl.ale.collect_sapl --uf AC
    python -m etl.ale.collect_sapl --uf AM --entidade votacoes --ano 2025
    python -m etl.ale.collect_sapl --uf PI --entidade presencas
"""

import argparse
import logging
import time
from datetime import date
from typing import Optional

from .base import (
    get_db, get_json,
    buscar_mapa_deputados_uf, buscar_politico_por_nome,
    normalizar_voto, normalizar_justificativa, parse_data,
    registrar_coleta
)

log = logging.getLogger(__name__)

ANO_ATUAL = date.today().year
ANOS_PADRAO = [ANO_ATUAL - 1, ANO_ATUAL]

# Mapa UF → domínio SAPL
SAPL_DOMINIOS = {
    'AC': 'https://sapl.al.ac.leg.br',
    'AP': 'https://sapl.alap.leg.br',
    'AM': 'https://sapl.aleam.gov.br',
    'RR': 'https://sapl.al.rr.leg.br',
}

# Mapa de voto SAPL (inteiros)
SAPL_VOTO = {
    1:   'sim',
    2:   'nao',
    3:   'abstencao',
    4:   'obstrucao',
    0:   'ausente',
    '1': 'sim',
    '2': 'nao',
    '3': 'abstencao',
    '4': 'obstrucao',
    '0': 'ausente',
}


def get_sapl_url(uf: str) -> Optional[str]:
    dominio = SAPL_DOMINIOS.get(uf.upper())
    if not dominio:
        log.error(f"[SAPL] UF {uf} não configurada. Domínios disponíveis: {list(SAPL_DOMINIOS.keys())}")
        return None
    return f'{dominio}/api'


def sapl_paginate(base_url: str, endpoint: str, params: dict = None) -> list[dict]:
    """Pagina o endpoint SAPL (usa cursor 'next')."""
    url = f'{base_url}/{endpoint}/'
    itens = []
    p = params or {}

    while url:
        dados = get_json(url, params=p if not itens else None)
        if not dados:
            break

        if isinstance(dados, list):
            itens.extend(dados)
            break

        itens.extend(dados.get('results', []))
        url = dados.get('next')  # SAPL usa DRF → 'next' é URL completa

        if url:
            time.sleep(0.3)

    return itens


# ──────────────────────────────────────────────────────────────────────────────
# Parlamentares
# ──────────────────────────────────────────────────────────────────────────────

def collect_parlamentares(conn, uf: str, base_url: str) -> int:
    log.info(f"[SAPL/{uf}] Coletando parlamentares...")
    parlamentares = sapl_paginate(base_url, 'parlamentares/parlamentar')

    total = 0
    with conn.cursor() as cur:
        for p in parlamentares:
            id_ale = str(p.get('id') or p.get('pk') or '')
            nome = (p.get('nome_parlamentar') or p.get('nome') or '').strip()
            nome_completo = (p.get('nome') or '').strip()
            foto_url = p.get('foto') or None

            if not id_ale:
                continue

            cur.execute("""
                UPDATE politicos SET
                    id_ale    = COALESCE(id_ale, %s),
                    foto_url  = COALESCE(foto_url, %s),
                    atualizado_em = now()
                WHERE cargo = 'deputado_estadual' AND uf = %s
                  AND (id_ale = %s OR nome_eleitoral ILIKE %s OR nome ILIKE %s)
                  AND removido_em IS NULL
            """, (id_ale, foto_url, uf.upper(), id_ale, nome, nome_completo))

            if cur.rowcount > 0:
                total += 1

        conn.commit()

    log.info(f"[SAPL/{uf}] {total} parlamentares atualizados")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Sessões e Votações
# ──────────────────────────────────────────────────────────────────────────────

def _nome_do_str(str_field: str) -> str:
    """Extrai nome do parlamentar do campo __str__ do SAPL.
    Ex: '...Parlamentar: ADAILTON CRUZ' → 'ADAILTON CRUZ'
    """
    if 'Parlamentar:' in str_field:
        return str_field.split('Parlamentar:')[-1].strip()
    return ''


def collect_votacoes(conn, uf: str, base_url: str, anos: list[int]) -> int:
    log.info(f"[SAPL/{uf}] Coletando votações para {anos}...")
    total = 0
    fonte = f'sapl_{uf.lower()}'

    for ano in anos:
        sessoes = sapl_paginate(base_url, 'sessao/sessaoplenaria',
                                 {'data_inicio__year': ano})
        log.info(f"[SAPL/{uf}] {ano}: {len(sessoes)} sessões")

        for sessao in sessoes:
            id_sessao = str(sessao.get('id') or '')
            data_str = sessao.get('data_inicio') or ''
            data = parse_data(data_str)
            descricao_sessao = str(sessao.get('__str__') or f'Sessão {id_sessao}')[:300]

            # Registros de votação da sessão (resumo)
            registros = sapl_paginate(base_url, 'sessao/registrovotacao',
                                       {'sessao_plenaria': id_sessao})

            for reg in registros:
                id_reg = str(reg.get('id') or '')
                if not id_reg:
                    continue
                proposicao_str = str(reg.get('materia') or reg.get('expediente') or '')[:200]
                descricao = (reg.get('observacao') or descricao_sessao)[:500]

                # Votos individuais via votoparlamentar/?votacao={id_reg}
                votos_list = sapl_paginate(base_url, 'sessao/votoparlamentar',
                                            {'votacao': id_reg})

                batch = []
                for voto_item in votos_list:
                    voto_raw = voto_item.get('voto') or ''
                    voto_norm = normalizar_voto(str(voto_raw))
                    if not voto_norm:
                        continue

                    # Match por nome extraído do __str__
                    nome = _nome_do_str(voto_item.get('__str__') or '')
                    politico_id = None
                    if nome:
                        with conn.cursor() as cur:
                            politico_id = buscar_politico_por_nome(cur, nome, uf)
                    if not politico_id:
                        continue

                    id_parl = str(voto_item.get('parlamentar') or '')
                    source_rec = f'sapl_{uf.lower()}_{id_sessao}_{id_reg}_{id_parl}'
                    batch.append((
                        politico_id, data, voto_norm, descricao, proposicao_str,
                        f'{base_url}/sessao/sessaoplenaria/{id_sessao}/', fonte, source_rec
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
                        log.info(f"[SAPL/{uf}] Sessão {id_sessao} reg {id_reg}: {len(batch)} votos")

                time.sleep(0.2)

    log.info(f"[SAPL/{uf}] Total votações: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Presenças via presencaordemdia (endpoint real do SAPL)
# ──────────────────────────────────────────────────────────────────────────────

def collect_presencas(conn, uf: str, base_url: str, anos: list[int]) -> int:
    """
    SAPL tem endpoint real de presença: /api/sessao/presencaordemdia/
    Campos: sessao_plenaria (int), parlamentar (int), __str__ (tem o nome)
    Todos os registros = presente=True (ausências não são registradas aqui)
    """
    log.info(f"[SAPL/{uf}] Coletando presenças (presencaordemdia) para {anos}...")

    with conn.cursor() as cur:
        mapa = buscar_mapa_deputados_uf(cur, uf)

    total = 0
    fonte = f'sapl_{uf.lower()}'

    for ano in anos:
        sessoes = sapl_paginate(base_url, 'sessao/sessaoplenaria',
                                 {'data_inicio__year': ano})

        for sessao in sessoes:
            id_sessao = str(sessao.get('id') or sessao.get('pk') or '')
            data_str = sessao.get('data_inicio') or sessao.get('data') or ''
            data = parse_data(data_str)
            if not data:
                continue

            tipo_raw = str(sessao.get('tipo') or '').lower()
            tipo_sessao = 'comissao' if 'comiss' in tipo_raw else 'plenario'

            # Listar parlamentares que votaram nesta sessão = presentes
            votos = sapl_paginate(base_url, 'sessao/votoparlamentar',
                                   {'sessao_plenaria': id_sessao})

            # presencaordemdia: todos registros = presente
            presencas = sapl_paginate(base_url, 'sessao/presencaordemdia',
                                       {'sessao_plenaria': id_sessao})

            batch = []
            vistos = set()
            for pres in presencas:
                id_parl = str(pres.get('parlamentar') or '')
                if id_parl in vistos:
                    continue
                vistos.add(id_parl)

                nome = _nome_do_str(pres.get('__str__') or '')
                politico_id = None
                if nome:
                    with conn.cursor() as cur:
                        politico_id = buscar_politico_por_nome(cur, nome, uf)
                if not politico_id:
                    continue

                source_rec = f'sapl_{uf.lower()}_pres_{id_sessao}_{id_parl}'
                batch.append((
                    politico_id, data, uf.upper(), tipo_sessao, True, None,
                    fonte, fonte, source_rec
                ))

            if batch:
                with conn.cursor() as cur:
                    cur.executemany("""
                        INSERT INTO ale_presencas
                            (politico_id, data, uf, tipo_sessao, presente, justificativa,
                             fonte, source_id, source_record_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (source_id, source_record_id) DO NOTHING
                    """, batch)
                    conn.commit()
                    total += len(batch)
                    log.info(f"[SAPL/{uf}] Sessão {id_sessao}: {len(batch)} presenças")

            time.sleep(0.3)

    log.info(f"[SAPL/{uf}] Total presenças: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='ETL SAPL genérico — ALEs que usam SAPL')
    parser.add_argument('--uf', required=True, choices=list(SAPL_DOMINIOS.keys()),
                        help='UF da assembleia')
    parser.add_argument('--entidade', choices=['parlamentares', 'votacoes', 'presencas', 'tudo'],
                        default='tudo')
    parser.add_argument('--ano', nargs='+', type=int, default=ANOS_PADRAO)
    args = parser.parse_args()

    base_url = get_sapl_url(args.uf)
    if not base_url:
        return

    conn = get_db()
    fonte = f'sapl_{args.uf.lower()}'

    try:
        totais = {}
        if args.entidade in ('parlamentares', 'tudo'):
            totais['parlamentares'] = collect_parlamentares(conn, args.uf, base_url)
        if args.entidade in ('votacoes', 'tudo'):
            totais['votacoes'] = collect_votacoes(conn, args.uf, base_url, args.ano)
        if args.entidade in ('presencas', 'tudo'):
            totais['presencas'] = collect_presencas(conn, args.uf, base_url, args.ano)

        with conn.cursor() as cur:
            for entidade, n in totais.items():
                registrar_coleta(cur, fonte, entidade, n)
            conn.commit()

        log.info(f"[SAPL/{args.uf}] Concluído: {totais}")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
