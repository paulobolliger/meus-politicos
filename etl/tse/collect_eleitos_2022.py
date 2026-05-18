"""
Coleta governadores e deputados estaduais eleitos em 2022 do TSE e persiste no banco.

Fonte:
  CSV: consulta_cand_2022_BR.csv (ISO-8859-1, delim ';')
  Filtro: DS_SIT_TOT_TURNO in ('ELEITO', 'ELEITO POR QP', 'ELEITO POR MEDIA')
  Cargos: GOVERNADOR, DEPUTADO ESTADUAL, DEPUTADO DISTRITAL

Tabelas afetadas: politicos, partidos, candidaturas_historico, coletas_log

Uso:
  python collect_eleitos_2022.py [--uf SP] [--limite 1000]
"""

import argparse
import csv
import io
import logging
import os
import time
import zipfile
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

ELEICAO_ANO = 2022

CARGOS_ALVO = {'GOVERNADOR', 'DEPUTADO ESTADUAL', 'DEPUTADO DISTRITAL'}

CARGO_MAP: dict[str, str] = {
    'GOVERNADOR': 'governador',
    'DEPUTADO ESTADUAL': 'deputado_estadual',
    'DEPUTADO DISTRITAL': 'deputado_estadual',
}

SITUACOES_ELEITO = {
    'ELEITO',
    'ELEITO POR QP',
    'ELEITO POR MEDIA',
    'MÉDIA',
    'ELEITO POR MÉDIA',
}

MANDATO_INICIO = '2023-01-01'
MANDATO_FIM = '2026-12-31'

SENTINELAS = {'#NULO#', '#NE#', '#NULO', '', 'NÃO INFORMADO'}


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


def normalizar_sexo(ds_genero: Optional[str]) -> Optional[str]:
    if not ds_genero:
        return None
    g = ds_genero.strip().upper()
    if g == 'MASCULINO':
        return 'M'
    if g == 'FEMININO':
        return 'F'
    return None


def parse_data(valor: Optional[str]) -> Optional[str]:
    """Converte datas do TSE (DD/MM/YYYY) para ISO YYYY-MM-DD."""
    if not valor:
        return None
    v = valor.strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%Y%m%d'):
        try:
            from datetime import datetime
            return datetime.strptime(v, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None


def gerar_slug(nome_urna: str, cargo: str, uf: str) -> str:
    cargo_abrev = {
        'governador': 'gov',
        'deputado_estadual': 'dep-est',
    }.get(cargo, cargo)
    nome_limpo = (
        unidecode(nome_urna)
        .lower()
        .replace(' ', '-')
        .replace('.', '')
        .replace("'", '')
    )
    return f'{nome_limpo}-{cargo_abrev}-{uf.lower()}'[:200]


def descobrir_zip_url(ano: int = 2022) -> Optional[str]:
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
                    # Arquivo principal de candidatos (sem sufixo de UF)
                    if 'consulta_cand' in url and url.endswith('.zip') and f'_{ano}.zip' in url:
                        log.info('ZIP encontrado: %s', url)
                        return url
    except Exception as exc:
        log.error('Falha ao descobrir via CKAN: %s', exc)

    url_fallback = f'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_{ano}.zip'
    log.warning('Usando URL canônica: %s', url_fallback)
    return url_fallback


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


def upsert_politico(cur, dados: dict, partido_id: Optional[str]) -> str:
    """
    Insere ou atualiza na tabela politicos (âncora: slug único por cargo/uf).
    Para governadores e deputados estaduais não há id_camara nem id_senado —
    usamos ON CONFLICT (slug) para idempotência.
    """
    cur.execute(
        '''
        INSERT INTO politicos (
            id, slug, nome, nome_eleitoral, cargo, situacao,
            uf, sexo, foto_url, email,
            data_nascimento,
            mandato_inicio, mandato_fim,
            partido_id, dado_estado,
            source_id, source_record_id, collected_at,
            criado_em, atualizado_em
        )
        VALUES (
            gen_random_uuid(), %s, %s, %s, %s, 'ativo',
            %s, %s, %s, %s,
            %s,
            %s, %s,
            %s, 'oficial',
            'tse', %s, now(),
            now(), now()
        )
        ON CONFLICT (slug) DO UPDATE SET
            nome             = EXCLUDED.nome,
            nome_eleitoral   = EXCLUDED.nome_eleitoral,
            situacao         = 'ativo',
            uf               = EXCLUDED.uf,
            sexo             = COALESCE(EXCLUDED.sexo, politicos.sexo),
            foto_url         = COALESCE(EXCLUDED.foto_url, politicos.foto_url),
            email            = COALESCE(EXCLUDED.email, politicos.email),
            data_nascimento  = COALESCE(EXCLUDED.data_nascimento, politicos.data_nascimento),
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
            dados['slug'],
            dados['nome'],
            dados['nome_eleitoral'],
            dados['cargo'],
            dados['uf'],
            dados['sexo'],
            dados['foto_url'],
            dados['email'],
            dados['data_nascimento'],
            MANDATO_INICIO,
            MANDATO_FIM,
            partido_id,
            dados['sq_candidato'],
        ),
    )
    row = cur.fetchone()
    return str(row[0])


def upsert_candidatura_historico(cur, politico_id: str, partido_id: Optional[str],
                                  registro: dict, cargo: str, votos: Optional[int]):
    sq = limpar(registro.get('SQ_CANDIDATO'))
    uf = limpar(registro.get('SG_UF')) or ''

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

    percentual_raw = limpar(registro.get('PC_VOTOS_VALIDOS'))
    try:
        percentual = float(str(percentual_raw).replace(',', '.')) if percentual_raw else None
    except (ValueError, TypeError):
        percentual = None

    cur.execute(
        '''
        INSERT INTO candidaturas_historico (
            politico_id,
            eleicao_ano, cargo, partido_id, uf, numero_urna,
            resultado, votos, percentual,
            sq_candidato, id_tse,
            criado_em, atualizado_em
        )
        VALUES (
            %s,
            %s, %s, %s, %s, %s,
            'eleito', %s, %s,
            %s, %s,
            now(), now()
        )
        ''',
        (
            politico_id,
            ELEICAO_ANO, cargo, partido_id, uf, numero_urna,
            votos, percentual,
            sq, sq,
        ),
    )


def registrar_log(cur, status: str, registros: int, duracao_ms: int, mensagem: str = ''):
    cur.execute(
        '''
        INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, criado_em)
        VALUES ('tse', 'eleitos_2022', %s, %s, %s, %s, now())
        ''',
        (status, registros, duracao_ms, mensagem),
    )


def processar_csv(db, csv_stream, uf_filtro: Optional[str], limite: Optional[int]):
    cur = db.cursor()
    cache_partidos: dict[str, Optional[str]] = {}

    ok = 0
    erros = 0
    ignorados = 0
    lote = 0

    reader = csv.DictReader(csv_stream, delimiter=';')

    for i, row in enumerate(reader):
        if limite and i >= limite:
            break

        # Filtrar apenas eleitos
        sit_turno = (limpar(row.get('DS_SIT_TOT_TURNO')) or '').upper()
        if sit_turno not in SITUACOES_ELEITO:
            ignorados += 1
            continue

        cargo_raw = (limpar(row.get('DS_CARGO')) or '').upper()
        if cargo_raw not in CARGOS_ALVO:
            ignorados += 1
            continue

        cargo = CARGO_MAP.get(cargo_raw)
        if not cargo:
            ignorados += 1
            continue

        uf = limpar(row.get('SG_UF')) or ''
        if uf_filtro and uf.upper() != uf_filtro.upper():
            ignorados += 1
            continue

        try:
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

            nome = limpar(row.get('NM_CANDIDATO')) or ''
            nome_urna = limpar(row.get('NM_URNA_CANDIDATO')) or nome
            sq = limpar(row.get('SQ_CANDIDATO')) or ''
            foto_url = limpar(row.get('URL_FOTO'))
            email = limpar(row.get('NM_EMAIL'))
            data_nasc = parse_data(limpar(row.get('DT_NASCIMENTO')))
            sexo = normalizar_sexo(limpar(row.get('DS_GENERO')))

            votos_raw = limpar(row.get('QT_VOTOS_NOMINAIS_VALIDOS')) or limpar(row.get('QT_VOTOS_NOMINAIS'))
            try:
                votos = int(votos_raw) if votos_raw else None
            except (ValueError, TypeError):
                votos = None

            slug = gerar_slug(nome_urna, cargo, uf)

            dados = {
                'slug': slug,
                'nome': nome,
                'nome_eleitoral': nome_urna,
                'cargo': cargo,
                'uf': uf,
                'sexo': sexo,
                'foto_url': foto_url,
                'email': email,
                'data_nascimento': data_nasc,
                'sq_candidato': sq,
            }

            politico_id = upsert_politico(cur, dados, partido_id)
            upsert_candidatura_historico(cur, politico_id, partido_id, row, cargo, votos)

            ok += 1
            lote += 1

            if lote >= 200:
                db.commit()
                log.info('%d eleitos processados (%s...)', ok, uf)
                lote = 0

        except Exception as exc:
            log.warning('Erro na linha %d (SQ=%s): %s', i + 1, row.get('SQ_CANDIDATO', '?'), exc)
            db.rollback()
            erros += 1
            cur = db.cursor()

    if lote > 0:
        db.commit()

    return ok, erros, ignorados


def coletar_eleitos(uf_filtro: Optional[str] = None, limite: Optional[int] = None):
    t0 = time.monotonic()

    zip_url = descobrir_zip_url(ELEICAO_ANO)
    if not zip_url:
        log.error('URL do ZIP não encontrada. Abortando.')
        return

    log.info('Baixando ZIP de candidatos 2022 de: %s', zip_url)

    try:
        with SESSION.get(zip_url, stream=True, timeout=300) as resp:
            resp.raise_for_status()
            conteudo_bytes = resp.content
    except Exception as exc:
        log.error('Falha ao baixar ZIP: %s', exc)
        return

    log.info('ZIP baixado (%d bytes). Extraindo CSV...', len(conteudo_bytes))

    # Extrair o CSV principal do ZIP (arquivo BR ou o maior arquivo)
    try:
        with zipfile.ZipFile(io.BytesIO(conteudo_bytes)) as zf:
            nomes = zf.namelist()
            log.info('Arquivos no ZIP: %s', nomes)
            # Pegar o CSV principal (geralmente o maior ou o que tem _BR no nome)
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

    log.info('CSV extraído (%d bytes). Processando apenas eleitos...', len(conteudo))
    csv_stream = io.StringIO(conteudo)

    db = get_db()
    try:
        ok, erros, ignorados = processar_csv(db, csv_stream, uf_filtro, limite)
    finally:
        duracao_ms = int((time.monotonic() - t0) * 1000)
        status = 'ok' if erros == 0 else ('falhou' if ok == 0 else 'atrasado')
        mensagem = f'{ok} políticos inseridos/atualizados, {erros} erros, {ignorados} ignorados'

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
    parser.add_argument('--limite', type=int, default=None, help='Limite de linhas para teste')
    args = parser.parse_args()
    coletar_eleitos(uf_filtro=args.uf, limite=args.limite)
