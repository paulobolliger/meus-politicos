"""
update_presenca_pct.py — Atualiza presenca_pct_atual em politicos a partir de ale_presencas

Executa após qualquer coleta de presenças.
Calcula o % do ano atual (ou ano mais recente disponível).

Uso:
    python -m etl.ale.update_presenca_pct
    python -m etl.ale.update_presenca_pct --ano 2024
    python -m etl.ale.update_presenca_pct --uf MG
"""

import argparse
import logging
from datetime import date

from .base import get_db, registrar_coleta

log = logging.getLogger(__name__)
ANO_ATUAL = date.today().year


def update_presenca_pct(conn, ano: int, uf: str | None = None) -> int:
    """
    Recalcula presenca_pct_atual para todos os dep. estaduais
    com dados em ale_presencas para o ano informado.
    """
    log.info(f"Atualizando presenca_pct_atual — ano {ano}" + (f" / UF {uf}" if uf else ""))

    uf_clause = "AND p.uf = %(uf)s" if uf else ""

    with conn.cursor() as cur:
        cur.execute(f"""
            WITH pct AS (
                SELECT
                    ap.politico_id,
                    ROUND(
                        100.0 * COUNT(*) FILTER (WHERE ap.presente)
                        / NULLIF(COUNT(*), 0),
                        1
                    ) AS presenca_pct
                FROM ale_presencas ap
                JOIN politicos p ON p.id = ap.politico_id
                WHERE EXTRACT(YEAR FROM ap.data) = %(ano)s
                  AND p.cargo = 'deputado_estadual'
                  {uf_clause}
                GROUP BY ap.politico_id
            )
            UPDATE politicos
               SET presenca_pct_atual = pct.presenca_pct,
                   atualizado_em      = now()
            FROM pct
            WHERE politicos.id = pct.politico_id
        """, {'ano': ano, 'uf': uf})

        total = cur.rowcount
        conn.commit()

    log.info(f"presenca_pct_atual atualizado para {total} deputados")
    return total


def main():
    parser = argparse.ArgumentParser(
        description='Atualiza presenca_pct_atual em politicos a partir de ale_presencas'
    )
    parser.add_argument('--ano', type=int, default=ANO_ATUAL)
    parser.add_argument('--uf', type=str, default=None,
                        help='Filtrar por UF (ex: MG, SP). Padrão: todas.')
    args = parser.parse_args()

    conn = get_db()
    try:
        n = update_presenca_pct(conn, args.ano, args.uf)
        with conn.cursor() as cur:
            registrar_coleta(cur, 'ale_agregacao', 'presenca_pct', n)
            conn.commit()
    finally:
        conn.close()


if __name__ == '__main__':
    main()
