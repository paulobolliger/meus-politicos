"""
Coleta o histórico de tramitação de todas as proposições da Câmara.

API: GET https://dadosabertos.camara.leg.br/api/v2/proposicoes/{id}/tramitacoes

Uso:
  python etl/camara/collect_tramitacoes.py              # todas pendentes (sem tramitacoes)
  python etl/camara/collect_tramitacoes.py --limit 100  # só 100 (teste)
  python etl/camara/collect_tramitacoes.py --all        # força re-coleta de todas

Tempo estimado: ~22.000 chamadas × 0.3s = ~110 min no total
"""

import os
import time
import logging
import argparse
import requests
import psycopg
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / "app" / ".env.local")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

CONN_STR = (
    f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
    f"port={os.getenv('POSTGRES_PORT', '5433')} "
    f"dbname={os.getenv('POSTGRES_DB', 'meuspoliticos_db')} "
    f"user={os.getenv('POSTGRES_USER', 'postgres')} "
    f"password={os.getenv('POSTGRES_PASSWORD', '')}"
)

API_URL = "https://dadosabertos.camara.leg.br/api/v2/proposicoes/{id}/tramitacoes"
HEADERS = {"Accept": "application/json"}
DELAY   = 0.3


def buscar_tramitacoes(id_camara: int) -> list[dict]:
    """Retorna lista de tramitações ou [] em caso de erro."""
    try:
        r = requests.get(
            API_URL.format(id=id_camara),
            headers=HEADERS,
            timeout=15,
        )
        if r.status_code == 404:
            return []
        r.raise_for_status()
        return r.json().get("dados", []) or []
    except Exception as e:
        log.warning(f"Erro ao buscar tramitacoes {id_camara}: {e}")
        return []


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Max proposicoes a processar")
    parser.add_argument("--all",   action="store_true",    help="Re-coleta mesmo as que já têm tramitações")
    args = parser.parse_args()

    with psycopg.connect(CONN_STR) as conn:
        with conn.cursor() as cur:

            # 1. Buscar proposicoes a processar
            if args.all:
                query = "SELECT id, id_camara, tipo, numero, ano FROM proposicoes WHERE id_camara IS NOT NULL ORDER BY data_apresentacao DESC NULLS LAST"
            else:
                query = """
                    SELECT p.id, p.id_camara, p.tipo, p.numero, p.ano
                    FROM proposicoes p
                    WHERE p.id_camara IS NOT NULL
                      AND NOT EXISTS (
                        SELECT 1 FROM proposicao_tramitacoes t WHERE t.id_camara = p.id_camara
                      )
                    ORDER BY p.data_apresentacao DESC NULLS LAST
                """
            if args.limit:
                query += f" LIMIT {args.limit}"

            cur.execute(query)
            proposicoes = cur.fetchall()
            log.info(f"Proposições a processar: {len(proposicoes)}")

            ok = 0
            sem_dados = 0
            erros = 0

            for i, (pid, id_camara, tipo, numero, ano) in enumerate(proposicoes, 1):
                ref = f"{tipo} {numero}/{ano}"
                tramitacoes = buscar_tramitacoes(id_camara)

                if not tramitacoes:
                    sem_dados += 1
                    if i % 50 == 0:
                        log.info(f"[{i}/{len(proposicoes)}] {ref} → sem tramitações")
                    time.sleep(DELAY)
                    continue

                # Upsert cada step
                inseridos = 0
                for t in tramitacoes:
                    try:
                        cur.execute("""
                            INSERT INTO proposicao_tramitacoes
                              (id_camara, sequencia, data_hora, sigla_orgao,
                               descricao_tramitacao, cod_tipo_tramitacao,
                               descricao_situacao, cod_situacao,
                               despacho, regime, ambito, url_documento)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (id_camara, sequencia) DO UPDATE SET
                              descricao_situacao   = EXCLUDED.descricao_situacao,
                              despacho             = EXCLUDED.despacho,
                              url_documento        = EXCLUDED.url_documento
                        """, (
                            id_camara,
                            t.get("sequencia"),
                            t.get("dataHora"),
                            t.get("siglaOrgao"),
                            t.get("descricaoTramitacao"),
                            t.get("codTipoTramitacao"),
                            t.get("descricaoSituacao"),
                            t.get("codSituacao"),
                            t.get("despacho"),
                            t.get("regime"),
                            t.get("ambito"),
                            t.get("url"),
                        ))
                        inseridos += 1
                    except Exception as e:
                        log.warning(f"Erro ao inserir tramitacao {ref} seq {t.get('sequencia')}: {e}")
                        erros += 1

                ok += 1
                if i % 20 == 0 or i <= 5:
                    log.info(f"[{i}/{len(proposicoes)}] {ref} → {inseridos} steps")

                # Commit a cada 50 proposições
                if i % 50 == 0:
                    conn.commit()
                    log.info(f"  → commit parcial | ok={ok} sem_dados={sem_dados} erros={erros}")

                time.sleep(DELAY)

            conn.commit()
            log.info(f"Concluído: {ok} com tramitações | {sem_dados} sem dados | {erros} erros")


if __name__ == "__main__":
    main()
