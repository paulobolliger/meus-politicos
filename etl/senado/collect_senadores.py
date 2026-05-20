"""
Coleta senadores ativos da API do Senado Federal e persiste no banco.

Fontes:
  GET https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json
  GET https://legis.senado.leg.br/dadosabertos/senador/{id}.json

Tabelas afetadas: politicos, senadores, partidos, coletas_log
"""

import os
import time
import logging
import uuid
import json
from datetime import datetime, timezone

import psycopg
import requests
from dotenv import load_dotenv
from unidecode import unidecode

load_dotenv(
    os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
log = logging.getLogger(__name__)

BASE_URL = 'https://legis.senado.leg.br/dadosabertos'
SESSION = requests.Session()
SESSION.headers.update({
    'Accept': 'application/json',
    'User-Agent': 'meuspoliticos-etl/1.0',
})


# ── DB ────────────────────────────────────────────────────────────────────────

def get_db():
    return psycopg.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        user=os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='prefer',
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def gerar_slug(nome_eleitoral: str, uf: str) -> str:
    nome_limpo = (
        unidecode(nome_eleitoral)
        .lower()
        .replace(' ', '-')
        .replace('.', '')
        .replace("'", '')
    )
    return f'{nome_limpo}-sen-{uf.lower()}'


def normalizar_sexo(sigla: str | None) -> str | None:
    if not sigla:
        return None
    s = sigla.strip().upper()
    if s in ('M', 'MASC', 'MASCULINO'):
        return 'M'
    if s in ('F', 'FEM', 'FEMININO'):
        return 'F'
    return None


def parse_data(valor: str | None) -> str | None:
    if not valor:
        return None
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%Y%m%d'):
        try:
            return datetime.strptime(valor.strip(), fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None


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


# ── Partido ───────────────────────────────────────────────────────────────────

def upsert_partido(cur, sigla: str, nome: str | None = None) -> str | None:
    if not sigla:
        return None
    sigla = sigla.strip().upper()
    cur.execute(
        '''
        INSERT INTO partidos (sigla, nome, ativo)
        VALUES (%s, %s, TRUE)
        ON CONFLICT (sigla) DO UPDATE SET
            nome = COALESCE(EXCLUDED.nome, partidos.nome),
            ativo = TRUE,
            atualizado_em = now()
        RETURNING id
        ''',
        (sigla, nome or sigla),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


# ── Politico (hub central) ────────────────────────────────────────────────────

def upsert_politico(cur, dados: dict, partido_id: str | None) -> str:
    """
    Insere ou atualiza na tabela politicos.
    Usa id_senado como âncora de upsert.
    Retorna o UUID interno do politico.
    """
    cur.execute(
        '''
        INSERT INTO politicos (
            id, id_senado, slug, nome, nome_eleitoral, cargo, situacao,
            uf, sexo, foto_url, email,
            mandato_inicio, mandato_fim,
            partido_id, dado_estado,
            source_id, source_record_id, collected_at,
            criado_em, atualizado_em
        )
        VALUES (
            gen_random_uuid(), %s, %s, %s, %s, 'senador', 'ativo',
            %s, %s, %s, %s,
            %s, %s,
            %s, 'oficial',
            'senado_legis', %s, now(),
            now(), now()
        )
        ON CONFLICT (id_senado) DO UPDATE SET
            slug             = COALESCE(politicos.slug, EXCLUDED.slug),
            nome             = EXCLUDED.nome,
            nome_eleitoral   = EXCLUDED.nome_eleitoral,
            situacao         = 'ativo',
            uf               = EXCLUDED.uf,
            sexo             = COALESCE(EXCLUDED.sexo, politicos.sexo),
            foto_url         = COALESCE(EXCLUDED.foto_url, politicos.foto_url),
            email            = COALESCE(EXCLUDED.email, politicos.email),
            mandato_inicio   = COALESCE(EXCLUDED.mandato_inicio, politicos.mandato_inicio),
            mandato_fim      = COALESCE(EXCLUDED.mandato_fim, politicos.mandato_fim),
            partido_id       = COALESCE(EXCLUDED.partido_id, politicos.partido_id),
            dado_estado      = 'oficial',
            source_record_id = EXCLUDED.source_record_id,
            collected_at     = now(),
            atualizado_em    = now()
        RETURNING id
        ''',
        (
            dados['id_senado'],
            dados['slug'],
            dados['nome'],
            dados['nome_eleitoral'],
            dados['uf'],
            dados['sexo'],
            dados['foto_url'],
            dados['email'],
            dados['mandato_inicio'],
            dados['mandato_fim'],
            partido_id,
            str(dados['id_senado']),  # source_record_id
        ),
    )
    row = cur.fetchone()
    return str(row[0])


def upsert_senador(cur, politico_id: str, id_senado: int, partido_id: str | None, dados: dict):
    cur.execute(
        '''
        INSERT INTO senadores (
            politico_id, id_senado, nome, nome_completo,
            uf, email, foto_url, is_current,
            mandato_inicio, mandato_fim,
            partido_id, dado_estado,
            source_id, source_record_id, collected_at,
            criado_em, atualizado_em
        )
        VALUES (
            %s, %s, %s, %s,
            %s, %s, %s, TRUE,
            %s, %s,
            %s, 'oficial',
            'senado_legis', %s, now(),
            now(), now()
        )
        ON CONFLICT (id_senado, is_current) DO UPDATE SET
            politico_id      = EXCLUDED.politico_id,
            nome             = EXCLUDED.nome,
            nome_completo    = EXCLUDED.nome_completo,
            uf               = EXCLUDED.uf,
            email            = COALESCE(EXCLUDED.email, senadores.email),
            foto_url         = COALESCE(EXCLUDED.foto_url, senadores.foto_url),
            mandato_inicio   = COALESCE(EXCLUDED.mandato_inicio, senadores.mandato_inicio),
            mandato_fim      = COALESCE(EXCLUDED.mandato_fim, senadores.mandato_fim),
            partido_id       = COALESCE(EXCLUDED.partido_id, senadores.partido_id),
            dado_estado      = 'oficial',
            source_record_id = EXCLUDED.source_record_id,
            collected_at     = now(),
            atualizado_em    = now()
        ''',
        (
            politico_id,
            id_senado,
            dados['nome_eleitoral'],
            dados['nome'],
            dados['uf'],
            dados['email'],
            dados['foto_url'],
            dados['mandato_inicio'],
            dados['mandato_fim'],
            partido_id,
            str(id_senado),
        ),
    )


def registrar_log(cur, status: str, registros: int, duracao_ms: int, mensagem: str = ''):
    cur.execute(
        '''
        INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, criado_em)
        VALUES ('senado_legis', 'senadores', %s, %s, %s, %s, now())
        ''',
        (status, registros, duracao_ms, mensagem),
    )


# ── Coleta principal ──────────────────────────────────────────────────────────

def coletar_senadores():
    inicio = datetime.now(timezone.utc)
    t0 = time.monotonic()

    log.info('Buscando lista de senadores em exercício...')
    try:
        lista_json = get_json('/senador/lista/atual.json')
    except Exception as exc:
        log.error('Falha ao buscar lista de senadores: %s', exc)
        return

    senadores_raw = (
        lista_json
        .get('ListaParlamentarEmExercicio', {})
        .get('Parlamentares', {})
        .get('Parlamentar', [])
    )

    if not senadores_raw:
        log.error('Nenhum senador encontrado na resposta')
        return

    log.info('Encontrados %d senadores', len(senadores_raw))

    db = get_db()
    ok = 0
    erros = 0

    for item in senadores_raw:
        id_info = item.get('IdentificacaoParlamentar', {})
        id_senado = id_info.get('CodigoParlamentar')

        if not id_senado:
            log.warning('Senador sem CodigoParlamentar: %s', item)
            erros += 1
            continue

        id_senado = int(id_senado)

        try:
            log.info('Coletando senador %d...', id_senado)
            perfil_json = get_json(f'/senador/{id_senado}.json')
            time.sleep(0.2)  # respeitar rate limit

            parlamentar = (
                perfil_json
                .get('DetalheParlamentar', {})
                .get('Parlamentar', {})
            )
            id_info_detalhe = parlamentar.get('IdentificacaoParlamentar', {})
            mandato = parlamentar.get('MandatoAtual', {})

            nome_eleitoral = id_info_detalhe.get('NomeParlamentar') or id_info.get('NomeParlamentar', '')
            nome_completo = id_info_detalhe.get('NomeCompletoParlamentar') or nome_eleitoral
            uf = (id_info_detalhe.get('UfParlamentar') or id_info.get('UfParlamentar', '')).strip().upper()
            sigla_partido = (
                id_info_detalhe.get('SiglaPartidoParlamentar')
                or id_info.get('SiglaPartidoParlamentar', '')
            ).strip().upper()
            sexo = normalizar_sexo(id_info_detalhe.get('SiglaSexoParlamentar'))
            foto_url = id_info_detalhe.get('UrlFotoParlamentar') or id_info.get('UrlFotoParlamentar')
            email = id_info_detalhe.get('EmailParlamentar')
            mandato_inicio = parse_data(mandato.get('DataInicio'))
            mandato_fim = parse_data(mandato.get('DataFim'))
            slug = gerar_slug(nome_eleitoral, uf)

            dados = {
                'id_senado': id_senado,
                'slug': slug,
                'nome': nome_completo,
                'nome_eleitoral': nome_eleitoral,
                'uf': uf,
                'sexo': sexo,
                'foto_url': foto_url,
                'email': email,
                'mandato_inicio': mandato_inicio,
                'mandato_fim': mandato_fim,
            }

            with db.transaction():
                cur = db.cursor()
                partido_id = upsert_partido(cur, sigla_partido)
                politico_id = upsert_politico(cur, dados, partido_id)
                upsert_senador(cur, politico_id, id_senado, partido_id, dados)

            log.info('✓ %s (%s-%s)', nome_eleitoral, sigla_partido, uf)
            ok += 1

        except Exception as exc:
            log.error('Erro ao processar senador %d: %s', id_senado, exc)
            erros += 1
            continue

    duracao_ms = int((time.monotonic() - t0) * 1000)
    status = 'ok' if erros == 0 else ('falhou' if ok == 0 else 'atrasado')
    mensagem = f'{ok} inseridos/atualizados, {erros} erros'

    with db.transaction():
        cur = db.cursor()
        registrar_log(cur, status, ok, duracao_ms, mensagem)

    db.close()
    log.info('Concluído: %s em %dms', mensagem, duracao_ms)


if __name__ == '__main__':
    coletar_senadores()
