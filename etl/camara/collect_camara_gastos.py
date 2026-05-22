"""
Coleta gastos CEAP (Cota para Exercício da Atividade Parlamentar) dos deputados federais.

Fonte:
  GET https://dadosabertos.camara.leg.br/api/v2/deputados/{id}/despesas

Tabelas afetadas: gastos, politicos (gasto_total_ano), coletas_log

Uso:
  python collect_camara_gastos.py [--ano 2025] [--paginas 50]

Notas:
  - A API da Câmara retorna até 100 itens por página.
  - Para o histórico completo, rode --ano para cada ano: 2023 2024 2025 2026.
  - Os deputados precisam estar no banco (rode collect_deputados.py antes).
"""

import argparse
import os
import time
import logging
from datetime import datetime

import psycopg
import requests
from dotenv import load_dotenv

load_dotenv(
    os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local')
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
log = logging.getLogger(__name__)

BASE_URL = 'https://dadosabertos.camara.leg.br/api/v2'
PAGE_SIZE = 100

SESSION = requests.Session()
SESSION.headers.update({
    'Accept': 'application/json',
    'User-Agent': 'meuspoliticos-etl/1.0',
})


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable',
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
    )


def get_json(path: str, params: dict = None) -> list | dict | None:
    url = f'{BASE_URL}{path}'
    for tentativa in range(3):
        try:
            r = SESSION.get(url, params=params, timeout=30)
            if r.status_code == 404:
                return None
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            log.warning('Tentativa %d falhou: %s — %s', tentativa + 1, url, exc)
            if tentativa < 2:
                time.sleep(2 ** tentativa)
    return None


def buscar_deputados(cur) -> list[tuple[str, int]]:
    """Retorna lista de (politico_id, id_camara) para deputados federais ativos."""
    cur.execute(
        "SELECT id, id_camara FROM politicos WHERE cargo = 'deputado_federal' AND id_camara IS NOT NULL AND removido_em IS NULL"
    )
    return [(str(row[0]), int(row[1])) for row in cur.fetchall()]


def upsert_gasto(cur, politico_id: str, despesa: dict, ano: int):
    """Mapeia um item de despesa da API da Câmara para a tabela gastos."""
    mes_raw   = despesa.get('mes') or despesa.get('numMes')
    valor_raw = despesa.get('valorDocumento') or despesa.get('valorLiquido') or 0

    if not mes_raw:
        return

    try:
        mes_int = int(mes_raw)
        if not 1 <= mes_int <= 12:
            return
    except (ValueError, TypeError):
        return

    try:
        valor = float(str(valor_raw).replace(',', '.').strip())
        if valor < 0:
            return
    except (ValueError, TypeError):
        return

    categoria   = despesa.get('tipoDespesa') or despesa.get('descricao') or ''
    fornecedor  = despesa.get('nomeFornecedor') or ''
    cnpj        = despesa.get('cnpjCpfFornecedor') or ''
    descricao   = despesa.get('descricaoEspecificacao') or despesa.get('urlDocumento') or ''
    num_doc     = despesa.get('numDocumento') or despesa.get('codDocumento') or ''

    # source_record_id único para evitar duplicatas em re-execuções
    source_record_id = f'{politico_id}_{ano}_{mes_int}_{num_doc or hash(f"{categoria}{fornecedor}{valor}")}'

    cur.execute(
        '''
        INSERT INTO gastos (
            politico_id, ano, mes, valor,
            categoria, fornecedor, cnpj_cpf, descricao,
            dado_estado,
            source_id, source_record_id, collected_at,
            criado_em, atualizado_em
        )
        VALUES (
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            'oficial',
            'camara_ceap', %s, now(),
            now(), now()
        )
        ON CONFLICT (source_id, source_record_id) DO UPDATE SET
            valor         = EXCLUDED.valor,
            categoria     = COALESCE(EXCLUDED.categoria, gastos.categoria),
            fornecedor    = COALESCE(EXCLUDED.fornecedor, gastos.fornecedor),
            dado_estado   = 'oficial',
            collected_at  = now(),
            atualizado_em = now()
        ''',
        (
            politico_id, ano, mes_int, valor,
            categoria or None, fornecedor or None, cnpj or None, descricao or None,
            source_record_id,
        ),
    )


def atualizar_gasto_total_ano(cur, politico_id: str, ano: int):
    cur.execute(
        '''
        UPDATE politicos
        SET gasto_total_ano = (
            SELECT COALESCE(SUM(valor), 0)
            FROM gastos
            WHERE politico_id = %s AND ano = %s
        ),
        atualizado_em = now()
        WHERE id = %s
        ''',
        (politico_id, ano, politico_id),
    )


def registrar_log(cur, status: str, registros: int, duracao_ms: int, mensagem: str = ''):
    cur.execute(
        '''
        INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, criado_em)
        VALUES ('camara_ceap', 'gastos', %s, %s, %s, %s, now())
        ''',
        (status, registros, duracao_ms, mensagem),
    )


def coletar_gastos_deputado(cur, politico_id: str, id_camara: int, ano: int, max_paginas: int) -> int:
    """Coleta todas as despesas de um deputado em um ano. Retorna número de registros."""
    total = 0
    pagina = 1

    while pagina <= max_paginas:
        dados = get_json(
            f'/deputados/{id_camara}/despesas',
            params={'ano': ano, 'pagina': pagina, 'itens': PAGE_SIZE},
        )
        if dados is None or not dados.get('dados'):
            break

        despesas = dados['dados']
        for despesa in despesas:
            upsert_gasto(cur, politico_id, despesa, ano)
            total += 1

        if len(despesas) < PAGE_SIZE:
            break
        pagina += 1

    return total


def coletar_gastos(ano: int, max_paginas: int = 50):
    t0 = time.monotonic()
    db = get_db()
    cur = db.cursor()

    deputados = buscar_deputados(cur)
    if not deputados:
        log.warning('Nenhum deputado federal encontrado. Rode collect_deputados.py primeiro.')
        db.close()
        return

    log.info('Coletando CEAP %d para %d deputados...', ano, len(deputados))
    ok = 0
    erros = 0
    total_gastos = 0

    for i, (politico_id, id_camara) in enumerate(deputados, 1):
        try:
            n = coletar_gastos_deputado(cur, politico_id, id_camara, ano, max_paginas)
            atualizar_gasto_total_ano(cur, politico_id, ano)
            db.commit()
            total_gastos += n
            ok += 1
            if i % 50 == 0 or i == len(deputados):
                log.info('  [%d/%d] deputado %d — %d gastos (total: %d)',
                         i, len(deputados), id_camara, n, total_gastos)
        except Exception as exc:
            log.error('Erro ao processar deputado %d: %s', id_camara, exc)
            erros += 1
            # Tentar rollback; se a conexão caiu, reconectar
            try:
                db.rollback()
            except Exception:
                log.warning('Conexão perdida — reconectando...')
                try:
                    db.close()
                except Exception:
                    pass
                time.sleep(3)
                db = get_db()
                cur = db.cursor()
                log.info('Reconectado. Continuando a partir do deputado %d/%d.', i + 1, len(deputados))

        time.sleep(0.1)  # respeitar rate limit

    duracao_ms = int((time.monotonic() - t0) * 1000)
    status = 'ok' if erros == 0 else ('falhou' if ok == 0 else 'parcial')
    mensagem = f'{total_gastos} gastos, {ok} deputados OK, {erros} erros, ano {ano}'
    try:
        registrar_log(cur, status, total_gastos, duracao_ms, mensagem)
        db.commit()
    except Exception as exc:
        log.warning('Falha ao registrar log final: %s', exc)
    try:
        db.close()
    except Exception:
        pass
    log.info('Concluído: %d gastos inseridos/atualizados, %d erros, ano %d em %dms',
             total_gastos, erros, ano, duracao_ms)
    log.info('Concluído: %s em %.1fs', mensagem, duracao_ms / 1000)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Coleta gastos CEAP dos deputados federais (API da Câmara)'
    )
    parser.add_argument('--ano', type=int, default=datetime.now().year,
                        help='Ano dos gastos (padrão: ano corrente)')
    parser.add_argument('--paginas', type=int, default=50,
                        help='Máximo de páginas por deputado (padrão: 50 = 5000 registros/dep)')
    args = parser.parse_args()
    coletar_gastos(ano=args.ano, max_paginas=args.paginas)
