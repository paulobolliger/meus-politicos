"""
Coleta gastos CEAPS (Cota para Exercício da Atividade Parlamentar do Senado).

Fonte:
  GET https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps/{ano}

Tabelas afetadas: gastos, politicos (gasto_total_ano), coletas_log

Uso:
  python collect_senado_gastos.py [--ano 2025]
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
    os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local')
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
log = logging.getLogger(__name__)

BASE_URL = 'https://adm.senado.gov.br/adm-dadosabertos/api/v1'
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
    )


def get_json(path: str) -> list | dict:
    url = f'{BASE_URL}{path}'
    for tentativa in range(3):
        try:
            r = SESSION.get(url, timeout=60)
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            log.warning('Tentativa %d falhou: %s — %s', tentativa + 1, url, exc)
            if tentativa < 2:
                time.sleep(2 ** tentativa)
    raise RuntimeError(f'Falha ao buscar {url}')


def buscar_senadores(cur) -> list[tuple[str, int]]:
    """Retorna lista de (politico_id, id_senado) para senadores ativos."""
    cur.execute(
        "SELECT id, id_senado FROM politicos WHERE cargo = 'senador' AND id_senado IS NOT NULL AND removido_em IS NULL"
    )
    return [(str(row[0]), int(row[1])) for row in cur.fetchall()]


def upsert_gasto(cur, politico_id: str, gasto: dict, ano: int):
    # Campos da API do Senado CEAPS (adm.senado.gov.br)
    # Campos reais: mes, valor, tipoDespesa, fornecedor, cpfCnpj, detalhamento, documento
    mes = gasto.get('mes') or gasto.get('Mes') or gasto.get('MesReferencia')
    valor_raw = (
        gasto.get('valor') or gasto.get('Valor')
        or gasto.get('ValorReembolsado') or gasto.get('valorReembolsado')
        or '0'
    )
    categoria = (
        gasto.get('tipoDespesa') or gasto.get('TipoDespesa')
        or gasto.get('Descricao') or gasto.get('descricao')
    )
    fornecedor = (
        gasto.get('fornecedor') or gasto.get('nomeFornecedor')
        or gasto.get('NomeFornecedor')
    )
    cnpj = (
        gasto.get('cpfCnpj') or gasto.get('cnpjCpfFornecedor')
        or gasto.get('CnpjCpfFornecedor')
    )
    descricao = (
        gasto.get('detalhamento') or gasto.get('detalhe')
        or gasto.get('Detalhe') or gasto.get('documento')
    )

    if not mes:
        return

    try:
        mes_int = int(str(mes).split('/')[0]) if '/' in str(mes) else int(mes)
        if not 1 <= mes_int <= 12:
            return
    except (ValueError, TypeError):
        return

    try:
        valor = float(str(valor_raw).replace(',', '.').replace('R$', '').strip())
        if valor < 0:
            return
    except (ValueError, TypeError):
        return

    source_record_id = f'{politico_id}_{ano}_{mes_int}_{categoria or ""}_{fornecedor or ""}'

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
            'senado_ceaps', %s, now(),
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
            categoria, fornecedor, cnpj, descricao,
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
        VALUES ('senado_ceaps', 'gastos', %s, %s, %s, %s, now())
        ''',
        (status, registros, duracao_ms, mensagem),
    )


def coletar_gastos(ano: int):
    import time as _time
    t0 = _time.monotonic()

    db = get_db()
    cur = db.cursor()

    senadores = buscar_senadores(cur)
    if not senadores:
        log.warning('Nenhum senador encontrado no banco. Rode collect_senadores.py primeiro.')
        db.close()
        return

    log.info('Coletando gastos CEAPS %d para %d senadores...', ano, len(senadores))

    # A API do Senado retorna todos os gastos do ano em uma chamada
    try:
        gastos_json = get_json(f'/senadores/despesas_ceaps/{ano}')
    except Exception as exc:
        log.error('Falha ao buscar gastos CEAPS %d: %s', ano, exc)
        db.close()
        return

    # Indexar por id_senado
    gastos_por_senador: dict[int, list] = {}
    registros_raw = gastos_json if isinstance(gastos_json, list) else gastos_json.get('dados', [])

    for registro in registros_raw:
        id_senado_raw = (
            registro.get('codSenador') or registro.get('codigoParlamentar')
            or registro.get('CodigoParlamentar')
        )
        if not id_senado_raw:
            continue
        try:
            id_senado = int(id_senado_raw)
        except (ValueError, TypeError):
            continue
        gastos_por_senador.setdefault(id_senado, []).append(registro)

    ok = 0
    erros = 0

    for politico_id, id_senado in senadores:
        gastos_senador = gastos_por_senador.get(id_senado, [])
        if not gastos_senador:
            log.debug('Sem gastos para senador %d no ano %d', id_senado, ano)
            continue

        try:
            for gasto in gastos_senador:
                upsert_gasto(cur, politico_id, gasto, ano)
                ok += 1

            atualizar_gasto_total_ano(cur, politico_id, ano)
            db.commit()
            log.info('✓ Senador %d: %d gastos', id_senado, len(gastos_senador))

        except Exception as exc:
            log.error('Erro ao processar senador %d: %s', id_senado, exc)
            db.rollback()
            erros += 1

    import time as _t
    duracao_ms = int((_t.monotonic() - t0) * 1000)
    status = 'ok' if erros == 0 else ('falhou' if ok == 0 else 'atrasado')
    mensagem = f'{ok} gastos inseridos/atualizados, {erros} erros, ano {ano}'

    registrar_log(cur, status, ok, duracao_ms, mensagem)
    db.commit()
    db.close()
    log.info('Concluído: %s em %dms', mensagem, duracao_ms)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ano', type=int, default=datetime.now().year)
    args = parser.parse_args()
    coletar_gastos(ano=args.ano)
