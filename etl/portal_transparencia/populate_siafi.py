"""
Popula politicos.codigo_siafi usando as emendas já coletadas.

Estratégia:
  Para cada emenda individual (não bancada) que não tem politico_id,
  extrai o siafi do codigoEmenda (chars 4-7) e tenta match por nome
  entre emendas.nome_parlamentar e politicos.nome_eleitoral.

  Quando encontra match único, atualiza politicos.codigo_siafi e
  retroativamente preenche emendas.politico_id.

Uso:
  python populate_siafi.py [--dry-run]
"""

import argparse
import os
import logging
from unidecode import unidecode

import psycopg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable',
    )


def normalizar(nome: str) -> str:
    """Remove acentos, lowercase, remove pontuação."""
    return unidecode(nome or '').lower().strip()


def popular_siafi(dry_run: bool = False):
    db = get_db()
    cur = db.cursor()

    # Buscar todos os políticos ativos (deputados + senadores)
    cur.execute(
        "SELECT id, nome_eleitoral, codigo_siafi FROM politicos WHERE removido_em IS NULL"
    )
    politicos = cur.fetchall()

    # Indexar por nome normalizado
    por_nome: dict[str, list] = {}
    for pid, nome, siafi in politicos:
        chave = normalizar(nome)
        por_nome.setdefault(chave, []).append((str(pid), siafi))

    log.info('%d políticos indexados por nome', len(por_nome))

    # Buscar emendas sem politico_id (apenas individuais, não bancada)
    cur.execute(
        """
        SELECT DISTINCT nome_parlamentar, numero_emenda, source_record_id
        FROM emendas
        WHERE politico_id IS NULL
          AND tipo_emenda NOT ILIKE '%bancada%'
          AND nome_parlamentar IS NOT NULL
        ORDER BY nome_parlamentar
        """
    )
    sem_match = cur.fetchall()
    log.info('%d nomes distintos de parlamentares sem match', len(sem_match))

    matches = 0
    ambiguos = 0
    sem_encontrar = 0

    # Coletar todos os nomes de emendas e seus siafis extraídos
    # source_record_id = "2024_202471050005"
    # codigoEmenda = "202471050005" → chars 5-8 (1-indexed) = siafi
    # No source_record_id: "2024_" tem 5 chars, depois vem codigoEmenda
    # Posição do siafi no source_record_id: 5 (underscore) + 4 (ano emenda) + 1 = posição 10
    cur.execute(
        """
        SELECT DISTINCT nome_parlamentar,
               SUBSTRING(SPLIT_PART(source_record_id, '_', 2) FROM 5 FOR 4) AS siafi_extraido
        FROM emendas
        WHERE politico_id IS NULL
          AND tipo_emenda NOT ILIKE '%bancada%'
          AND nome_parlamentar IS NOT NULL
          AND LENGTH(source_record_id) >= 16
        """
    )
    emendas_sem_match = cur.fetchall()

    siafi_para_politico: dict[str, str] = {}  # siafi → politico_id

    for nome_parlamentar, siafi_extraido in emendas_sem_match:
        chave = normalizar(nome_parlamentar)
        candidatos = por_nome.get(chave, [])

        if len(candidatos) == 1:
            politico_id, siafi_atual = candidatos[0]
            siafi_para_politico[siafi_extraido] = politico_id

            if not dry_run:
                # Atualizar codigo_siafi se ainda não tem
                if not siafi_atual and siafi_extraido:
                    try:
                        cur.execute(
                            "UPDATE politicos SET codigo_siafi = %s WHERE id = %s AND codigo_siafi IS NULL",
                            (siafi_extraido, politico_id)
                        )
                        log.debug('Siafi %s → %s (%s)', siafi_extraido, nome_parlamentar, politico_id)
                    except Exception as exc:
                        log.warning('Conflito siafi %s para %s: %s', siafi_extraido, nome_parlamentar, exc)
                        db.rollback()

                # Retroativamente preencher emendas.politico_id
                cur.execute(
                    """
                    UPDATE emendas
                    SET politico_id = %s, atualizado_em = now()
                    WHERE politico_id IS NULL
                      AND nome_parlamentar = %s
                    """,
                    (politico_id, nome_parlamentar)
                )
                atualizados = cur.rowcount
                if atualizados > 0:
                    log.info('✓ %s → %d emendas linkadas', nome_parlamentar, atualizados)

            matches += 1

        elif len(candidatos) > 1:
            log.warning('Ambíguo: "%s" → %d candidatos', nome_parlamentar, len(candidatos))
            ambiguos += 1
        else:
            log.debug('Sem match: "%s"', nome_parlamentar)
            sem_encontrar += 1

    if not dry_run:
        db.commit()

    log.info(
        'Resultado: %d matches, %d ambíguos, %d sem encontrar%s',
        matches, ambiguos, sem_encontrar,
        ' (DRY RUN)' if dry_run else ''
    )
    db.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Só mostra, não altera')
    args = parser.parse_args()
    popular_siafi(dry_run=args.dry_run)
