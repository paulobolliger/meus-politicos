"""Coleta CEAP da Câmara pelo arquivo CSV anual oficial, atualizado diariamente."""

import argparse
import csv
import hashlib
import io
import logging
import os
import time
import zipfile
from datetime import datetime
from decimal import Decimal, InvalidOperation

import psycopg
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

DOWNLOAD_URL = 'https://www.camara.leg.br/cotas/Ano-{ano}.csv.zip'
BATCH_SIZE = 1000


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable',
        connect_timeout=15,
    )


def decimal_value(value: str | None) -> Decimal:
    try:
        return Decimal((value or '0').strip().replace(',', '.'))
    except InvalidOperation:
        return Decimal('0')


def record_id(row: dict[str, str]) -> str:
    document_id = (row.get('ideDocumento') or '').strip()
    if document_id:
        return document_id
    raw = '|'.join([
        row.get('ideCadastro') or '',
        row.get('numAno') or '',
        row.get('numMes') or '',
        row.get('txtNumero') or '',
        row.get('txtCNPJCPF') or '',
        row.get('vlrLiquido') or '',
        row.get('datEmissao') or '',
    ])
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


def download_rows(ano: int):
    url = DOWNLOAD_URL.format(ano=ano)
    log.info('Baixando %s', url)
    response = requests.get(url, timeout=(15, 300))
    response.raise_for_status()
    log.info('Arquivo baixado: %.1f MB', len(response.content) / 1024 / 1024)

    with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
        csv_name = next(name for name in archive.namelist() if name.lower().endswith('.csv'))
        with archive.open(csv_name) as raw:
            text = io.TextIOWrapper(raw, encoding='utf-8-sig', newline='')
            yield from csv.DictReader(text, delimiter=';')


def flush_batch(cur, batch: list[tuple]):
    cur.executemany(
        '''
        INSERT INTO gastos (
            politico_id, ano, mes, valor, valor_glosa,
            categoria, descricao, fornecedor, cnpj_cpf,
            dado_estado, source_id, source_record_id, collected_at,
            link_fonte, criado_em, atualizado_em
        )
        VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            'oficial', 'camara_ceap', %s, now(),
            %s, now(), now()
        )
        ON CONFLICT (source_id, source_record_id) DO UPDATE SET
            politico_id = EXCLUDED.politico_id,
            ano = EXCLUDED.ano,
            mes = EXCLUDED.mes,
            valor = EXCLUDED.valor,
            valor_glosa = EXCLUDED.valor_glosa,
            categoria = EXCLUDED.categoria,
            descricao = EXCLUDED.descricao,
            fornecedor = EXCLUDED.fornecedor,
            cnpj_cpf = EXCLUDED.cnpj_cpf,
            dado_estado = 'oficial',
            collected_at = now(),
            link_fonte = EXCLUDED.link_fonte,
            atualizado_em = now()
        ''',
        batch,
    )


def collect(ano: int):
    started = time.monotonic()
    total = 0
    skipped_without_member = 0
    batch: list[tuple] = []

    with get_db() as db:
        with db.cursor() as cur:
            cur.execute(
                "SELECT id_camara, id FROM politicos WHERE id_camara IS NOT NULL"
            )
            members = {str(id_camara): politico_id for id_camara, politico_id in cur.fetchall()}
            log.info('Mapa de %d deputados carregado', len(members))
            cur.execute(
                "DELETE FROM gastos WHERE source_id = 'camara_ceap' AND ano = %s",
                (ano,),
            )

            for row in download_rows(ano):
                member_id = members.get((row.get('ideCadastro') or '').strip())
                if not member_id:
                    skipped_without_member += 1
                    continue

                month = int(row.get('numMes') or 0)
                if not 1 <= month <= 12:
                    continue

                batch.append((
                    member_id,
                    ano,
                    month,
                    decimal_value(row.get('vlrLiquido')),
                    decimal_value(row.get('vlrGlosa')),
                    (row.get('txtDescricao') or '').strip() or None,
                    (row.get('txtDescricaoEspecificacao') or '').strip() or None,
                    (row.get('txtFornecedor') or '').strip() or None,
                    (row.get('txtCNPJCPF') or '').strip() or None,
                    record_id(row),
                    (row.get('urlDocumento') or '').strip() or None,
                ))
                total += 1

                if len(batch) >= BATCH_SIZE:
                    flush_batch(cur, batch)
                    batch.clear()
                    log.info('%d despesas processadas', total)

            if batch:
                flush_batch(cur, batch)

            cur.execute(
                '''
                UPDATE politicos p
                SET gasto_total_ano = totals.total,
                    atualizado_em = now()
                FROM (
                    SELECT politico_id, SUM(valor) AS total
                    FROM gastos
                    WHERE source_id = 'camara_ceap' AND ano = %s
                    GROUP BY politico_id
                ) totals
                WHERE p.id = totals.politico_id
                ''',
                (ano,),
            )

            duration_ms = int((time.monotonic() - started) * 1000)
            message = (
                f'{total} despesas processadas; '
                f'{skipped_without_member} linhas institucionais/sem deputado ignoradas; ano {ano}'
            )
            cur.execute(
                '''
                INSERT INTO coletas_log (
                    fonte, tipo, status, registros, duracao_ms, mensagem, criado_em
                )
                VALUES ('camara_ceap', 'gastos', 'ok', %s, %s, %s, now())
                ''',
                (total, duration_ms, message),
            )
            db.commit()

    if total == 0:
        raise RuntimeError(f'Arquivo CEAP {ano} não produziu despesas vinculadas')
    log.info('Concluído: %s', message)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Coleta CEAP anual pelo CSV oficial da Câmara')
    parser.add_argument('--ano', type=int, default=datetime.now().year)
    parser.add_argument('--paginas', type=int, help=argparse.SUPPRESS)
    args = parser.parse_args()
    collect(args.ano)
