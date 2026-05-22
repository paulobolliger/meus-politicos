"""
Coleta proposições legislativas da Câmara dos Deputados e persiste no banco.

Fonte:
  GET https://dadosabertos.camara.leg.br/api/v2/proposicoes

Tipos coletados: PL, PEC, PLP, PDL, MPV

Tabelas afetadas: proposicoes, proposicao_autores, coletas_log

Uso:
  python collect_proposicoes.py [--ano 2025] [--tipo PL] [--paginas 50]
"""

import argparse
import logging
import os
import time
from datetime import datetime, date
from typing import Optional

import psycopg
import requests
from dotenv import load_dotenv
from unidecode import unidecode

load_dotenv(
    os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local')
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
log = logging.getLogger(__name__)

BASE_URL = 'https://dadosabertos.camara.leg.br/api/v2'
SESSION = requests.Session()
SESSION.headers.update({
    'Accept': 'application/json',
    'User-Agent': 'meuspoliticos-etl/1.0',
})

TIPOS_ALVO = ['PL', 'PEC', 'PLP', 'PDL', 'MPV']
ITENS_POR_PAGINA = 100


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable',
    )


def get_json(path: str, params: dict | None = None) -> dict:
    url = f'{BASE_URL}{path}'
    for tentativa in range(3):
        try:
            r = SESSION.get(url, params=params, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            log.warning('Tentativa %d falhou para %s: %s', tentativa + 1, url, exc)
            if tentativa < 2:
                time.sleep(2 ** tentativa)
    raise RuntimeError(f'Falha ao buscar {url}')


def gerar_slug(tipo: str, numero: str, ano: int) -> str:
    return f'{tipo.lower()}-{numero}-{ano}'


def buscar_politico_id_por_camara(cur, id_camara: int) -> Optional[str]:
    cur.execute(
        'SELECT id FROM politicos WHERE id_camara = %s LIMIT 1',
        (id_camara,),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


def upsert_proposicao(cur, prop: dict) -> Optional[str]:
    id_camara = prop.get('id')
    if not id_camara:
        return None

    tipo = (prop.get('siglaTipo') or '').strip().upper()
    numero = str(prop.get('numero') or '').strip()
    ano = prop.get('ano')

    if not tipo or not numero or not ano:
        return None

    try:
        ano = int(ano)
    except (ValueError, TypeError):
        return None

    slug = gerar_slug(tipo, numero, ano)
    ementa = prop.get('ementa') or prop.get('ementaDetalhada')

    situacao = prop.get('statusProposicao', {}).get('descricaoSituacao') if isinstance(prop.get('statusProposicao'), dict) else prop.get('descricaoTipo')

    data_apres_raw = prop.get('dataApresentacao') or ''
    try:
        data_apres = data_apres_raw[:10] if data_apres_raw else None
    except Exception:
        data_apres = None

    link_camara = f'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao={id_camara}'

    source_record_id = str(id_camara)

    cur.execute(
        '''
        INSERT INTO proposicoes (
            id_camara, slug,
            tipo, numero, ano,
            ementa, situacao,
            casa_origem, data_apresentacao,
            link_camara,
            dado_estado,
            source_id, source_record_id, collected_at,
            criado_em, atualizado_em
        )
        VALUES (
            %s, %s,
            %s, %s, %s,
            %s, %s,
            'camara', %s,
            %s,
            'oficial',
            'camara_deputados', %s, now(),
            now(), now()
        )
        ON CONFLICT (id_camara) DO UPDATE SET
            situacao         = COALESCE(EXCLUDED.situacao, proposicoes.situacao),
            ementa           = COALESCE(EXCLUDED.ementa, proposicoes.ementa),
            link_camara      = EXCLUDED.link_camara,
            source_record_id = EXCLUDED.source_record_id,
            collected_at     = now(),
            atualizado_em    = now()
        RETURNING id
        ''',
        (
            id_camara, slug,
            tipo, numero, ano,
            ementa[:2000] if ementa else None,
            situacao[:500] if situacao else None,
            data_apres,
            link_camara,
            source_record_id,
        ),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


def upsert_autores(cur, proposicao_id: str, id_camara_prop: int):
    try:
        resp = get_json(f'/proposicoes/{id_camara_prop}/autores')
        time.sleep(0.2)
    except Exception as exc:
        log.debug('Não foi possível buscar autores de %d: %s', id_camara_prop, exc)
        return

    autores = resp.get('dados', [])

    # Remover autores antigos desta proposição antes de reinserir
    cur.execute('DELETE FROM proposicao_autores WHERE proposicao_id = %s', (proposicao_id,))

    for autor in autores:
        nome = autor.get('nome') or ''
        id_entidade = autor.get('idEntidade')
        tipo_entidade = autor.get('tipoDescricao') or ''

        politico_id = None
        cargo = None
        partido = None
        uf = None

        if id_entidade and 'Deputado' in tipo_entidade:
            try:
                politico_id = buscar_politico_id_por_camara(cur, int(id_entidade))
                # Buscar partido/uf do político no banco
                if politico_id:
                    cur.execute(
                        '''
                        SELECT p.sigla, pol.uf, pol.cargo::text
                        FROM politicos pol
                        LEFT JOIN partidos p ON pol.partido_id = p.id
                        WHERE pol.id = %s
                        ''',
                        (politico_id,),
                    )
                    row = cur.fetchone()
                    if row:
                        partido, uf, cargo = row
            except (ValueError, TypeError):
                pass

        if not nome:
            continue

        cur.execute(
            '''
            INSERT INTO proposicao_autores (proposicao_id, politico_id, nome, cargo, partido, uf)
            VALUES (%s, %s, %s, %s, %s, %s)
            ''',
            (proposicao_id, politico_id, nome[:200], cargo, partido, uf),
        )


def registrar_log(cur, status: str, registros: int, duracao_ms: int, mensagem: str = ''):
    cur.execute(
        '''
        INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, criado_em)
        VALUES ('camara_deputados', 'proposicoes', %s, %s, %s, %s, now())
        ''',
        (status, registros, duracao_ms, mensagem),
    )


def coletar_proposicoes(ano: int, tipos: list[str], max_paginas: int, sem_detalhes: bool = False):
    t0 = time.monotonic()
    db = get_db()
    cur = db.cursor()

    ok = 0
    erros = 0

    for tipo in tipos:
        log.info('Coletando %s do ano %d (sem_detalhes=%s)...', tipo, ano, sem_detalhes)
        pagina = 1

        while pagina <= max_paginas:
            try:
                resp = get_json(
                    '/proposicoes',
                    params={
                        'siglaTipo': tipo,
                        'ano': ano,
                        'itens': ITENS_POR_PAGINA,
                        'pagina': pagina,
                        'ordem': 'DESC',
                        'ordenarPor': 'id',
                    },
                )
                time.sleep(0.3)

                dados = resp.get('dados', [])
                if not dados:
                    log.info('%s ano %d: sem mais dados na pág %d', tipo, ano, pagina)
                    break

                for prop_resumo in dados:
                    id_camara = prop_resumo.get('id')
                    if not id_camara:
                        continue

                    if sem_detalhes:
                        # Modo rápido: usa só os dados da listagem (sem request por PL)
                        prop = prop_resumo
                    else:
                        # Modo completo: busca detalhes e autores de cada proposição
                        try:
                            detalhe_resp = get_json(f'/proposicoes/{id_camara}')
                            time.sleep(0.15)
                            prop = detalhe_resp.get('dados', prop_resumo)
                        except Exception:
                            prop = prop_resumo

                    try:
                        proposicao_id = upsert_proposicao(cur, prop)
                        if proposicao_id:
                            if not sem_detalhes:
                                upsert_autores(cur, proposicao_id, id_camara)
                            ok += 1
                    except Exception as exc:
                        log.warning('Erro ao processar proposição %d: %s', id_camara, exc)
                        db.rollback()
                        cur = db.cursor()
                        erros += 1
                        continue

                db.commit()
                log.info('%s pág %d: %d proposições processadas no total', tipo, pagina, ok)

                # Verificar se há mais páginas via links
                links = resp.get('links', [])
                tem_proxima = any(l.get('rel') == 'next' for l in links)
                if not tem_proxima:
                    break

                pagina += 1

            except Exception as exc:
                log.error('Erro na pág %d de %s/%d: %s', pagina, tipo, ano, exc)
                erros += 1
                break

    duracao_ms = int((time.monotonic() - t0) * 1000)
    status = 'ok' if erros == 0 else ('falhou' if ok == 0 else 'atrasado')
    mensagem = f'{ok} proposições inseridas/atualizadas, {erros} erros, tipos={tipos}, ano={ano}'

    try:
        registrar_log(cur, status, ok, duracao_ms, mensagem)
        db.commit()
    except Exception as exc:
        log.error('Erro ao registrar log: %s', exc)

    db.close()
    log.info('Concluído: %s em %dms', mensagem, duracao_ms)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ano', type=int, default=datetime.now().year)
    parser.add_argument(
        '--tipo',
        type=str,
        default=None,
        help='Tipo de proposição (ex: PL). Padrão: todos os tipos',
    )
    parser.add_argument(
        '--paginas',
        type=int,
        default=500,
        help='Máximo de páginas por tipo (cada pág tem 100 itens). Padrão: 500',
    )
    parser.add_argument(
        '--sem-detalhes',
        action='store_true',
        help='Modo rápido: pula GET individual por PL e não coleta autores (~100x mais rápido)',
    )
    args = parser.parse_args()

    tipos = [args.tipo.upper()] if args.tipo else TIPOS_ALVO
    coletar_proposicoes(ano=args.ano, tipos=tipos, max_paginas=args.paginas, sem_detalhes=args.sem_detalhes)
