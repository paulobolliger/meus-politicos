"""
Coleta candidatos 2026 do TSE e persiste no banco.

Fontes:
  1. CKAN: https://dadosabertos.tse.jus.br/api/3/action/package_search?q=candidatos+2026
     → descobre a URL do CSV dinamicamente
  2. CSV: consulta_cand_2026_BR.csv (ISO-8859-1, delim ';')

Tabelas afetadas: candidatos, candidaturas_historico, partidos, feed_eventos, coletas_log

Uso:
  python collect_candidatos_2026.py [--uf SP] [--limite 1000] [--sem-feed]
"""

import argparse
import csv
import io
import logging
import os
import sys
import time
import zipfile
from datetime import datetime, timezone
from typing import Optional

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

CKAN_URL = 'https://dadosabertos.tse.jus.br/api/3/action/package_search'
SESSION = requests.Session()
SESSION.headers.update({'User-Agent': 'meuspoliticos-etl/1.0'})

# Cargos TSE → ENUM cargo_tipo
CARGO_MAP: dict[str, str] = {
    'PRESIDENTE': 'presidente',
    'VICE-PRESIDENTE': 'vice_presidente',
    'GOVERNADOR': 'governador',
    'VICE-GOVERNADOR': 'vice_governador',
    'SENADOR': 'senador',
    'DEPUTADO FEDERAL': 'deputado_federal',
    'DEPUTADO ESTADUAL': 'deputado_estadual',
    'DEPUTADO DISTRITAL': 'deputado_estadual',
    'PREFEITO': 'prefeito',
    'VICE-PREFEITO': 'vice_prefeito',
    'VEREADOR': 'vereador',
}

# Situação TSE → ENUM situacao_candidato
SITUACAO_MAP: dict[str, str] = {
    'DEFERIDO': 'deferido',
    'DEFERIDO COM RECURSO': 'deferido',
    'DEFERIDO COM RECURSO NO TSE': 'deferido',
    'INDEFERIDO': 'indeferido',
    'INDEFERIDO COM RECURSO': 'indeferido',
    'INDEFERIDO COM RECURSO NO TSE': 'indeferido',
    'CASSADO': 'cassado',
    'CANCELADO': 'indeferido',
    'INAPTO': 'indeferido',
}

SENTINELAS = {'#NULO#', '#NE#', '#NULO', '', 'NÃO INFORMADO'}

ELEICAO_ANO = 2026


def get_db():
    return psycopg.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        user=os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='prefer',
    )


def limpar(valor: Optional[str]) -> Optional[str]:
    if not valor:
        return None
    v = valor.strip()
    return None if v in SENTINELAS else v


def gerar_slug(nome_urna: str, cargo: str, uf: str, ano: int) -> str:
    cargo_abrev = {
        'presidente': 'pres',
        'vice_presidente': 'vpres',
        'governador': 'gov',
        'vice_governador': 'vgov',
        'senador': 'sen',
        'deputado_federal': 'dep-fed',
        'deputado_estadual': 'dep-est',
        'prefeito': 'pref',
        'vice_prefeito': 'vpref',
        'vereador': 'ver',
    }.get(cargo, cargo)

    nome_limpo = (
        unidecode(nome_urna)
        .lower()
        .replace(' ', '-')
        .replace('.', '')
        .replace("'", '')
    )
    slug_base = f'{nome_limpo}-{cargo_abrev}-{uf.lower()}-{ano}'
    return slug_base[:200]


def descobrir_zip_url(ano: int = 2026) -> Optional[str]:
    """Descobre a URL do ZIP de candidatos via API CKAN do TSE."""
    log.info('Descobrindo URL do ZIP de candidatos %d via CKAN...', ano)
    try:
        r = SESSION.get(
            CKAN_URL,
            params={'q': f'candidatos {ano}', 'rows': 20},
            timeout=30,
        )
        r.raise_for_status()
        pacotes = r.json().get('result', {}).get('results', [])

        for pacote in pacotes:
            nome_pacote = pacote.get('name', '').lower()
            if str(ano) in nome_pacote and 'candidatos' in nome_pacote:
                for recurso in pacote.get('resources', []):
                    url = recurso.get('url', '')
                    nome = recurso.get('name', '').lower()
                    if 'consulta_cand' in url and url.endswith('.zip') and f'_{ano}.zip' in url:
                        log.info('ZIP encontrado: %s', url)
                        return url

        url_fallback = f'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_{ano}.zip'
        log.warning('ZIP não encontrado via CKAN; usando URL canônica: %s', url_fallback)
        return url_fallback

    except Exception as exc:
        log.error('Falha ao descobrir ZIP via CKAN: %s', exc)
        return f'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_{ano}.zip'


def upsert_partido(cur, sigla: str, nome: Optional[str] = None, numero: Optional[int] = None) -> Optional[str]:
    if not sigla or sigla in SENTINELAS:
        return None
    sigla = sigla.strip().upper()
    cur.execute(
        '''
        INSERT INTO partidos (sigla, nome, numero, ativo)
        VALUES (%s, %s, %s, TRUE)
        ON CONFLICT (sigla) DO UPDATE SET
            nome   = COALESCE(EXCLUDED.nome, partidos.nome),
            numero = COALESCE(EXCLUDED.numero, partidos.numero),
            ativo  = TRUE,
            atualizado_em = now()
        RETURNING id
        ''',
        (sigla, nome or sigla, numero),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


def buscar_politico_id(cur, nome_urna: str, cargo: str, uf: str) -> Optional[str]:
    """Tenta casar candidato com político existente via nome_eleitoral + cargo + uf."""
    if not nome_urna:
        return None
    nome_norm = unidecode(nome_urna).upper().strip()
    cur.execute(
        '''
        SELECT id FROM politicos
        WHERE UPPER(unaccent(nome_eleitoral)) = unaccent(%s)
          AND cargo = %s
          AND uf = %s
          AND removido_em IS NULL
        LIMIT 1
        ''',
        (nome_norm, cargo, uf.upper()),
    )
    row = cur.fetchone()
    if row:
        return str(row[0])
    # Fallback: match por nome completo
    cur.execute(
        '''
        SELECT id FROM politicos
        WHERE UPPER(unaccent(nome)) = unaccent(%s)
          AND cargo = %s
          AND uf = %s
          AND removido_em IS NULL
        LIMIT 1
        ''',
        (nome_norm, cargo, uf.upper()),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


def upsert_candidato(cur, registro: dict, partido_id: Optional[str], politico_id: Optional[str]) -> Optional[str]:
    sq = limpar(registro.get('SQ_CANDIDATO'))
    if not sq:
        return None

    nome = limpar(registro.get('NM_CANDIDATO')) or ''
    nome_urna = limpar(registro.get('NM_URNA_CANDIDATO')) or nome
    cargo_raw = limpar(registro.get('DS_CARGO')) or ''
    cargo = CARGO_MAP.get(cargo_raw.upper())
    if not cargo:
        return None

    uf = limpar(registro.get('SG_UF')) or ''
    situacao_raw = limpar(registro.get('DS_SITUACAO_CANDIDATURA')) or ''
    situacao = SITUACAO_MAP.get(situacao_raw.upper(), 'pendente')
    genero = limpar(registro.get('DS_GENERO'))
    cor_raca = limpar(registro.get('DS_COR_RACA'))

    numero_urna_raw = limpar(registro.get('NR_CANDIDATO'))
    try:
        numero_urna = int(numero_urna_raw) if numero_urna_raw else None
    except (ValueError, TypeError):
        numero_urna = None

    bens_raw = limpar(registro.get('VR_BEM_CANDIDATO'))
    try:
        bens = float(str(bens_raw).replace(',', '.')) if bens_raw else None
        if bens is not None and bens < 0:
            bens = None
    except (ValueError, TypeError):
        bens = None

    proposta_url = limpar(registro.get('URL_FOTO'))  # alguns CSVs incluem link proposta

    slug = gerar_slug(nome_urna, cargo, uf, ELEICAO_ANO)

    cur.execute(
        '''
        INSERT INTO candidatos (
            nome, nome_urna, slug, partido_id, numero_urna,
            cargo, uf,
            eleicao_ano, situacao,
            genero, cor_raca,
            politico_id,
            bens_declarados,
            proposta_url,
            id_tse, sequencial_tse,
            source_id, source_record_id, collected_at,
            dado_estado,
            criado_em, atualizado_em
        )
        VALUES (
            %s, %s, %s, %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s,
            %s,
            %s,
            %s, %s,
            'tse', %s, now(),
            'oficial',
            now(), now()
        )
        ON CONFLICT (id_tse) DO UPDATE SET
            nome             = EXCLUDED.nome,
            nome_urna        = EXCLUDED.nome_urna,
            partido_id       = COALESCE(EXCLUDED.partido_id, candidatos.partido_id),
            numero_urna      = COALESCE(EXCLUDED.numero_urna, candidatos.numero_urna),
            situacao         = EXCLUDED.situacao,
            genero           = COALESCE(EXCLUDED.genero, candidatos.genero),
            cor_raca         = COALESCE(EXCLUDED.cor_raca, candidatos.cor_raca),
            politico_id      = COALESCE(EXCLUDED.politico_id, candidatos.politico_id),
            bens_declarados  = COALESCE(EXCLUDED.bens_declarados, candidatos.bens_declarados),
            sequencial_tse   = EXCLUDED.sequencial_tse,
            source_record_id = EXCLUDED.source_record_id,
            collected_at     = now(),
            dado_estado      = 'oficial',
            atualizado_em    = now()
        RETURNING id
        ''',
        (
            nome, nome_urna, slug, partido_id, numero_urna,
            cargo, uf,
            ELEICAO_ANO, situacao,
            genero, cor_raca,
            politico_id,
            bens,
            proposta_url,
            sq, sq,   # id_tse = sequencial_tse = SQ_CANDIDATO
            sq,       # source_record_id
        ),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


def upsert_candidatura_historico(cur, candidato_id: str, politico_id: Optional[str],
                                  partido_id: Optional[str], registro: dict, cargo: str):
    sq = limpar(registro.get('SQ_CANDIDATO'))
    uf = limpar(registro.get('SG_UF')) or ''

    # Verificar se já existe
    cur.execute(
        'SELECT id FROM candidaturas_historico WHERE sq_candidato = %s AND eleicao_ano = %s LIMIT 1',
        (sq, ELEICAO_ANO),
    )
    if cur.fetchone():
        return

    numero_urna_raw = limpar(registro.get('NR_CANDIDATO'))
    try:
        numero_urna = int(numero_urna_raw) if numero_urna_raw else None
    except (ValueError, TypeError):
        numero_urna = None

    cur.execute(
        '''
        INSERT INTO candidaturas_historico (
            politico_id, candidato_id,
            eleicao_ano, cargo, partido_id, uf, numero_urna,
            resultado,
            sq_candidato, id_tse,
            criado_em, atualizado_em
        )
        VALUES (
            %s, %s,
            %s, %s, %s, %s, %s,
            'em_curso',
            %s, %s,
            now(), now()
        )
        ''',
        (
            politico_id, candidato_id,
            ELEICAO_ANO, cargo, partido_id, uf, numero_urna,
            sq, sq,
        ),
    )


def criar_feed_evento(cur, politico_id: str, candidato_id: str, registro: dict, cargo: str):
    nome_urna = limpar(registro.get('NM_URNA_CANDIDATO')) or limpar(registro.get('NM_CANDIDATO')) or ''
    cargo_label = {
        'presidente': 'Presidente',
        'senador': 'Senador',
        'governador': 'Governador',
        'deputado_federal': 'Deputado Federal',
        'deputado_estadual': 'Deputado Estadual',
    }.get(cargo, cargo)
    uf = limpar(registro.get('SG_UF')) or ''
    sigla_partido = limpar(registro.get('SG_PARTIDO')) or ''

    titulo = f'{nome_urna} registra candidatura a {cargo_label} {uf} ({sigla_partido})'

    # Não duplicar — verificar se já existe
    cur.execute(
        '''
        SELECT id FROM feed_eventos
        WHERE politico_id = %s AND tipo = 'candidatura_registrada' AND titulo = %s
        LIMIT 1
        ''',
        (politico_id, titulo),
    )
    if cur.fetchone():
        return

    cur.execute(
        '''
        INSERT INTO feed_eventos (
            politico_id, tipo, titulo,
            impacto_nivel, dado_estado,
            criado_em, atualizado_em
        )
        VALUES (
            %s, 'candidatura_registrada', %s,
            '3', 'oficial',
            now(), now()
        )
        ''',
        (politico_id, titulo),
    )


def registrar_log(cur, status: str, registros: int, duracao_ms: int, mensagem: str = ''):
    cur.execute(
        '''
        INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, criado_em)
        VALUES ('tse', 'candidatos_2026', %s, %s, %s, %s, now())
        ''',
        (status, registros, duracao_ms, mensagem),
    )


def processar_csv(db, csv_stream, uf_filtro: Optional[str], limite: Optional[int], criar_feed: bool):
    cur = db.cursor()

    # Cache de partidos já inseridos para evitar round-trips repetidos
    cache_partidos: dict[str, Optional[str]] = {}

    ok = 0
    erros = 0
    ignorados = 0
    lote = 0

    reader = csv.DictReader(csv_stream, delimiter=';')

    for i, row in enumerate(reader):
        if limite and i >= limite:
            break

        cargo_raw = limpar(row.get('DS_CARGO')) or ''
        cargo = CARGO_MAP.get(cargo_raw.upper())
        if not cargo:
            ignorados += 1
            continue

        uf = limpar(row.get('SG_UF')) or ''
        if uf_filtro and uf.upper() != uf_filtro.upper():
            ignorados += 1
            continue

        try:
            # Partido
            sigla = limpar(row.get('SG_PARTIDO')) or ''
            nome_partido = limpar(row.get('NM_PARTIDO'))
            numero_partido_raw = limpar(row.get('NR_PARTIDO'))
            try:
                numero_partido = int(numero_partido_raw) if numero_partido_raw else None
            except (ValueError, TypeError):
                numero_partido = None

            if sigla not in cache_partidos:
                cache_partidos[sigla] = upsert_partido(cur, sigla, nome_partido, numero_partido)
            partido_id = cache_partidos[sigla]

            # Entity resolution
            nome_urna = limpar(row.get('NM_URNA_CANDIDATO')) or ''
            politico_id = buscar_politico_id(cur, nome_urna, cargo, uf)

            # Upsert candidato
            candidato_id = upsert_candidato(cur, row, partido_id, politico_id)
            if not candidato_id:
                ignorados += 1
                continue

            # Histórico de candidatura
            upsert_candidatura_historico(cur, candidato_id, politico_id, partido_id, row, cargo)

            # Feed evento (só para quem já tem perfil)
            if criar_feed and politico_id:
                criar_feed_evento(cur, politico_id, candidato_id, row, cargo)

            ok += 1
            lote += 1

            if lote >= 500:
                db.commit()
                log.info('Lote confirmado: %d registros processados até agora', ok)
                lote = 0

        except Exception as exc:
            log.warning('Erro na linha %d (SQ=%s): %s', i + 1, row.get('SQ_CANDIDATO', '?'), exc)
            db.rollback()
            erros += 1
            cur = db.cursor()

    if lote > 0:
        db.commit()

    return ok, erros, ignorados


def coletar_candidatos(uf_filtro: Optional[str] = None, limite: Optional[int] = None, criar_feed: bool = True):
    t0 = time.monotonic()

    zip_url = descobrir_zip_url(ELEICAO_ANO)
    if not zip_url:
        log.error('Não foi possível obter a URL do ZIP. Abortando.')
        return

    log.info('Baixando ZIP de candidatos %d de: %s', ELEICAO_ANO, zip_url)

    try:
        with SESSION.get(zip_url, stream=True, timeout=300) as resp:
            resp.raise_for_status()
            tamanho = resp.headers.get('Content-Length', 'desconhecido')
            log.info('Tamanho do arquivo: %s bytes', tamanho)
            conteudo_bytes = resp.content
    except Exception as exc:
        log.error('Falha ao baixar ZIP: %s', exc)
        return

    log.info('ZIP baixado (%d bytes). Extraindo CSV...', len(conteudo_bytes))

    try:
        with zipfile.ZipFile(io.BytesIO(conteudo_bytes)) as zf:
            nomes = zf.namelist()
            log.info('Arquivos no ZIP: %s', nomes)
            csv_nome = next(
                (n for n in nomes if '_BR' in n.upper() and n.endswith('.csv')),
                next((n for n in nomes if n.endswith('.csv')), None)
            )
            if not csv_nome:
                log.error('Nenhum CSV encontrado no ZIP')
                return
            log.info('Usando arquivo: %s', csv_nome)
            csv_bytes = zf.read(csv_nome)
    except Exception as exc:
        log.error('Falha ao extrair ZIP: %s', exc)
        return

    try:
        conteudo = csv_bytes.decode('iso-8859-1')
    except UnicodeDecodeError:
        conteudo = csv_bytes.decode('utf-8', errors='replace')

    log.info('CSV extraído (%d bytes). Iniciando parse...', len(conteudo))
    csv_stream = io.StringIO(conteudo)

    db = get_db()
    try:
        ok, erros, ignorados = processar_csv(db, csv_stream, uf_filtro, limite, criar_feed)
    finally:
        duracao_ms = int((time.monotonic() - t0) * 1000)
        status = 'ok' if erros == 0 else ('falhou' if ok == 0 else 'atrasado')
        mensagem = f'{ok} candidatos inseridos/atualizados, {erros} erros, {ignorados} ignorados'

        try:
            cur = db.cursor()
            registrar_log(cur, status, ok, duracao_ms, mensagem)
            db.commit()
        except Exception as exc:
            log.error('Erro ao registrar log: %s', exc)

        db.close()

    log.info('Concluído: %s em %dms', mensagem, duracao_ms)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--uf', type=str, default=None, help='Filtrar por UF (ex: SP)')
    parser.add_argument('--limite', type=int, default=None, help='Limite de registros para teste')
    parser.add_argument('--sem-feed', action='store_true', help='Não criar feed_eventos')
    args = parser.parse_args()
    coletar_candidatos(
        uf_filtro=args.uf,
        limite=args.limite,
        criar_feed=not args.sem_feed,
    )
