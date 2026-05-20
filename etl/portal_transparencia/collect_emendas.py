"""
Coleta emendas parlamentares individuais e Emendas Pix
do Portal da Transparência do Governo Federal.

Fontes:
  Emendas individuais:
    GET https://api.portaldatransparencia.gov.br/api-de-dados/emendas
  Emendas Pix (Transferências Especiais):
    GET https://api.portaldatransparencia.gov.br/api-de-dados/transferencias-especiais

Autenticação: header chave-api (PORTAL_TRANSPARENCIA_API_KEY no .env.local)

Match com politicos: via codigo_siafi (4 dígitos extraídos do codigoEmenda).

Tabelas afetadas: emendas, politicos (total_emendas_ano, total_emendas_historico), coletas_log

Uso:
  python collect_emendas.py [--ano 2024] [--tipo emendas|pix|ambos]
  python collect_emendas.py --ano 2023 --ano 2024 --ano 2025
"""

import argparse
import os
import time
import logging
from datetime import datetime, timezone

import psycopg
import requests
from dotenv import load_dotenv

load_dotenv(
    os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
log = logging.getLogger(__name__)

BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados'
PAGE_SIZE = 500

SESSION = requests.Session()
SESSION.headers.update({
    'Accept': 'application/json',
    'User-Agent': 'meuspoliticos-etl/1.0',
    'chave-api': os.getenv('PORTAL_TRANSPARENCIA_API_KEY', ''),
})


def get_db():
    return psycopg.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        user=os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='prefer',
    )


def get_json(endpoint: str, params: dict) -> list | dict | None:
    url = f'{BASE_URL}/{endpoint}'
    for tentativa in range(3):
        try:
            r = SESSION.get(url, params=params, timeout=60)
            if r.status_code == 204:
                return []   # sem conteúdo
            if r.status_code == 401:
                log.error('API key inválida ou ausente (401). Verifique PORTAL_TRANSPARENCIA_API_KEY.')
                return None
            r.raise_for_status()
            return r.json()
        except requests.exceptions.HTTPError as exc:
            log.warning('HTTP %s na tentativa %d: %s', r.status_code, tentativa + 1, exc)
            if r.status_code in (429, 503):
                time.sleep(5 * (tentativa + 1))
            elif tentativa >= 2:
                return None
        except Exception as exc:
            log.warning('Tentativa %d falhou: %s', tentativa + 1, exc)
            if tentativa < 2:
                time.sleep(2 ** tentativa)
    return None


def extrair_siafi(codigo_emenda: str) -> str | None:
    """
    Extrai os 4 dígitos do codigo_siafi de dentro do codigoEmenda.
    Formato do codigoEmenda: AAAA SSSS QQQQ
      - AAAA = ano (4 dígitos)
      - SSSS = codigo_siafi do parlamentar (4 dígitos)
      - QQQQ = sequencial (4 dígitos)
    Alguns formatos têm separadores ou 12 chars sem espaços.
    """
    if not codigo_emenda:
        return None
    limpo = str(codigo_emenda).replace(' ', '').replace('-', '')
    if len(limpo) >= 8:
        return limpo[4:8]
    return None


def buscar_politico_por_siafi(cur, codigo_siafi: str) -> str | None:
    """Retorna politico_id (uuid como string) ou None."""
    if not codigo_siafi:
        return None
    cur.execute(
        'SELECT id FROM politicos WHERE codigo_siafi = %s LIMIT 1',
        (codigo_siafi,),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


def normalizar_municipio_ibge(codigo_raw) -> str | None:
    """Normaliza código IBGE: pode vir como int ou string com 6 ou 7 dígitos."""
    if not codigo_raw:
        return None
    s = str(codigo_raw).strip().zfill(7)
    if len(s) in (6, 7):
        return s
    return None


def upsert_emenda(cur, row: dict, politico_id: str | None, tipo: str, ano: int):
    """
    Insere ou atualiza uma emenda individual no banco.
    `row` é o objeto JSON de um item da API do Portal.
    `tipo`: 'individual' ou 'pix'
    """
    # --- Campos comuns ---
    codigo_emenda    = row.get('codigoEmenda') or row.get('codigoTransferencia') or ''
    nome_parlamentar = (
        row.get('nomeAutor') or row.get('nomeParlamentar') or
        row.get('autor') or row.get('nome') or ''
    )
    partido  = row.get('siglaPartidoPolitico') or row.get('partido') or ''
    uf       = row.get('siglaUfAutor') or row.get('uf') or row.get('siglaUf') or ''

    # Municipio
    municipio_ibge = normalizar_municipio_ibge(
        row.get('municipioIBGE') or row.get('codigoIBGEMunicipio') or
        row.get('municipio', {}).get('codigoIBGE') if isinstance(row.get('municipio'), dict) else None
    )
    municipio_nome = (
        row.get('municipio') if isinstance(row.get('municipio'), str) else
        (row.get('municipio', {}).get('nome') if isinstance(row.get('municipio'), dict) else None)
    ) or row.get('nomeMunicipio') or ''
    uf_municipio = row.get('siglaUfMunicipio') or row.get('ufMunicipio') or ''

    # Funcional-programática
    funcao    = row.get('funcao') or row.get('nomeFuncao') or ''
    subfuncao = row.get('subfuncao') or row.get('nomeSubfuncao') or ''
    acao      = row.get('nomeAcao') or row.get('acao') or ''

    # Valores — API pode retornar float ou string
    def parse_valor(v) -> float:
        if v is None:
            return 0.0
        try:
            return float(str(v).replace(',', '.').replace('R$', '').strip())
        except (ValueError, TypeError):
            return 0.0

    valor_emp  = parse_valor(row.get('valorEmpenhado') or row.get('valorEmpenho'))
    valor_liq  = parse_valor(row.get('valorLiquidado') or row.get('valorLiquidacao'))
    valor_pago = parse_valor(
        row.get('valorPago') or row.get('valorPagamento') or
        row.get('valorTransferido') or row.get('valor')
    )

    # Source IDs
    source_id = f'portal_transparencia_{tipo}'
    source_record_id = f'{ano}_{codigo_emenda}' if codigo_emenda else None
    if not source_record_id:
        # fallback para emendas sem código (não deveria acontecer)
        source_record_id = f'{ano}_{nome_parlamentar}_{funcao}_{municipio_ibge or ""}'

    cur.execute(
        '''
        INSERT INTO emendas (
            politico_id, nome_parlamentar, partido, uf, ano,
            tipo_emenda, numero_emenda,
            funcao, subfuncao, acao,
            municipio_ibge, municipio_nome, uf_municipio,
            valor_empenhado, valor_liquidado, valor_pago,
            dado_estado, source_id, source_record_id, collected_at,
            criado_em, atualizado_em
        )
        VALUES (
            %s, %s, %s, %s, %s,
            %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            'oficial', %s, %s, now(),
            now(), now()
        )
        ON CONFLICT (source_id, source_record_id) DO UPDATE SET
            politico_id      = COALESCE(EXCLUDED.politico_id, emendas.politico_id),
            valor_empenhado  = EXCLUDED.valor_empenhado,
            valor_liquidado  = EXCLUDED.valor_liquidado,
            valor_pago       = EXCLUDED.valor_pago,
            funcao           = COALESCE(EXCLUDED.funcao, emendas.funcao),
            subfuncao        = COALESCE(EXCLUDED.subfuncao, emendas.subfuncao),
            acao             = COALESCE(EXCLUDED.acao, emendas.acao),
            municipio_ibge   = COALESCE(EXCLUDED.municipio_ibge, emendas.municipio_ibge),
            municipio_nome   = COALESCE(EXCLUDED.municipio_nome, emendas.municipio_nome),
            dado_estado      = 'oficial',
            collected_at     = now(),
            atualizado_em    = now()
        ''',
        (
            politico_id, nome_parlamentar or None, partido or None, uf or None, ano,
            tipo, codigo_emenda or None,
            funcao or None, subfuncao or None, acao or None,
            municipio_ibge, municipio_nome or None, uf_municipio or None,
            valor_emp, valor_liq, valor_pago,
            source_id, source_record_id,
        ),
    )


def atualizar_agregados(cur, politico_id: str, ano_corrente: int):
    """Recalcula total_emendas_ano e total_emendas_historico no politico."""
    cur.execute(
        '''
        UPDATE politicos
        SET
          total_emendas_ano = (
            SELECT COALESCE(SUM(valor_pago), 0)
            FROM emendas
            WHERE politico_id = %s AND ano = %s
          ),
          total_emendas_historico = (
            SELECT COALESCE(SUM(valor_pago), 0)
            FROM emendas
            WHERE politico_id = %s
          ),
          atualizado_em = now()
        WHERE id = %s
        ''',
        (politico_id, ano_corrente, politico_id, politico_id),
    )


def registrar_log(cur, fonte: str, status: str, registros: int, duracao_ms: int, mensagem: str = ''):
    cur.execute(
        '''
        INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, criado_em)
        VALUES (%s, 'emendas', %s, %s, %s, %s, now())
        ''',
        (fonte, status, registros, duracao_ms, mensagem),
    )


def coletar_emendas_individuais(cur, ano: int) -> int:
    """Coleta emendas individuais do Portal da Transparência. Retorna nº de registros."""
    log.info('Coletando emendas individuais ano %d...', ano)
    pagina = 1
    total = 0
    sem_match = 0

    while True:
        params = {
            'ano': ano,
            'pagina': pagina,
            'tamanhoPagina': PAGE_SIZE,
        }
        dados = get_json('emendas', params)
        if dados is None:
            log.error('Falha ao buscar emendas individuais pág %d. Abortando.', pagina)
            break
        if not dados:
            break

        for row in dados:
            codigo_emenda = row.get('codigoEmenda', '')
            siafi = extrair_siafi(codigo_emenda)
            politico_id = buscar_politico_por_siafi(cur, siafi) if siafi else None
            if not politico_id:
                sem_match += 1

            try:
                upsert_emenda(cur, row, politico_id, 'individual', ano)
                total += 1
            except Exception as exc:
                log.warning('Erro ao upsert emenda %s: %s', codigo_emenda, exc)

        cur.connection.commit()
        log.info('  Pág %d — %d emendas acumuladas (sem match: %d)', pagina, total, sem_match)

        if len(dados) < PAGE_SIZE:
            break
        pagina += 1
        time.sleep(0.3)  # respeitar rate limit da API

    log.info('Emendas individuais %d: %d registros (%d sem match parlamentar)', ano, total, sem_match)
    return total


def coletar_emendas_pix(cur, ano: int) -> int:
    """Coleta Emendas Pix (Transferências Especiais). Retorna nº de registros."""
    log.info('Coletando Emendas Pix (transferências especiais) ano %d...', ano)
    pagina = 1
    total = 0
    sem_match = 0

    while True:
        params = {
            'ano': ano,
            'pagina': pagina,
            'tamanhoPagina': PAGE_SIZE,
        }
        dados = get_json('transferencias-especiais', params)
        if dados is None:
            log.error('Falha ao buscar Emendas Pix pág %d. Abortando.', pagina)
            break
        if not dados:
            break

        for row in dados:
            # Emendas Pix têm codigoTransferencia em vez de codigoEmenda
            codigo_raw = row.get('codigoTransferencia') or row.get('codigoEmenda') or ''
            siafi = extrair_siafi(codigo_raw)
            politico_id = buscar_politico_por_siafi(cur, siafi) if siafi else None
            if not politico_id:
                sem_match += 1

            try:
                upsert_emenda(cur, row, politico_id, 'pix', ano)
                total += 1
            except Exception as exc:
                log.warning('Erro ao upsert Emenda Pix %s: %s', codigo_raw, exc)

        cur.connection.commit()
        log.info('  Pág %d — %d Emendas Pix acumuladas (sem match: %d)', pagina, total, sem_match)

        if len(dados) < PAGE_SIZE:
            break
        pagina += 1
        time.sleep(0.3)

    log.info('Emendas Pix %d: %d registros (%d sem match parlamentar)', ano, total, sem_match)
    return total


def atualizar_todos_agregados(cur, ano: int):
    """Recalcula total_emendas_ano/historico para todos os políticos que têm emendas."""
    log.info('Atualizando agregados de emendas em politicos...')
    cur.execute(
        "SELECT DISTINCT politico_id FROM emendas WHERE politico_id IS NOT NULL"
    )
    ids = [row[0] for row in cur.fetchall()]
    for pid in ids:
        atualizar_agregados(cur, str(pid), ano)
    cur.connection.commit()
    log.info('Agregados atualizados para %d parlamentares', len(ids))


def coletar(anos: list[int], tipo: str = 'ambos'):
    t0 = time.monotonic()
    db = get_db()
    cur = db.cursor()

    total_global = 0
    erros = 0

    for ano in anos:
        try:
            if tipo in ('emendas', 'ambos'):
                n = coletar_emendas_individuais(cur, ano)
                total_global += n
                registrar_log(cur, 'portal_transparencia_emendas', 'ok', n,
                              int((time.monotonic() - t0) * 1000),
                              f'Emendas individuais {ano}: {n} registros')
                db.commit()

            if tipo in ('pix', 'ambos'):
                n = coletar_emendas_pix(cur, ano)
                total_global += n
                registrar_log(cur, 'portal_transparencia_pix', 'ok', n,
                              int((time.monotonic() - t0) * 1000),
                              f'Emendas Pix {ano}: {n} registros')
                db.commit()

        except Exception as exc:
            log.error('Erro ao coletar ano %d: %s', ano, exc)
            erros += 1
            db.rollback()

    # Atualizar agregados nos políticos ao final
    try:
        ano_principal = max(anos) if anos else datetime.now().year
        atualizar_todos_agregados(cur, ano_principal)
    except Exception as exc:
        log.error('Erro ao atualizar agregados: %s', exc)

    duracao_ms = int((time.monotonic() - t0) * 1000)
    log.info(
        'Concluído: %d registros totais, %d erros, %.1fs',
        total_global, erros, duracao_ms / 1000
    )
    db.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Coleta emendas parlamentares do Portal da Transparência'
    )
    parser.add_argument(
        '--ano', type=int, action='append', dest='anos',
        help='Ano para coletar (pode repetir: --ano 2023 --ano 2024). Padrão: ano corrente.'
    )
    parser.add_argument(
        '--tipo', choices=['emendas', 'pix', 'ambos'], default='ambos',
        help='Tipo de emenda para coletar (padrão: ambos)'
    )
    args = parser.parse_args()
    anos = args.anos or [datetime.now().year]
    coletar(anos=anos, tipo=args.tipo)
