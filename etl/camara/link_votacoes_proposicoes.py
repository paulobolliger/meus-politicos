"""
Liga votacoes.proposicao usando a API da Câmara.
Chama GET /api/v2/votacoes/{id} para cada proposicao_id único,
extrai tipo+numero+ano e atualiza o banco.

Roda em ~10-15 min (1445 chamadas com rate limit gentil).
"""

import os
import time
import logging
import requests
import psycopg
from pathlib import Path
from dotenv import load_dotenv

# .env fica em app/.env.local — sobe dois níveis a partir de etl/camara/
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

API_URL = "https://dadosabertos.camara.leg.br/api/v2/votacoes/{id}"
HEADERS  = {"Accept": "application/json"}
DELAY    = 0.5   # segundos entre chamadas


def buscar_proposicao(votacao_id: str) -> str | None:
    """Retorna 'PL 1234/2025' ou None se não encontrado."""
    try:
        r = requests.get(API_URL.format(id=votacao_id), headers=HEADERS, timeout=10)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        dados    = r.json().get("dados", {})
        afetadas = dados.get("proposicoesAfetadas") or []
        if afetadas:
            prop   = afetadas[0]
            tipo   = prop.get("siglaTipo")
            numero = prop.get("numero")
            ano    = prop.get("ano")
            if tipo and numero and ano and int(ano) > 0:
                return f"{tipo} {numero}/{ano}"
        return None
    except Exception as e:
        log.warning(f"Erro ao buscar {votacao_id}: {e}")
        return None


def main():
    with psycopg.connect(CONN_STR) as conn:
        with conn.cursor() as cur:

            # 1. IDs únicos ainda sem proposicao
            cur.execute("""
                SELECT DISTINCT proposicao_id
                FROM votacoes
                WHERE proposicao IS NULL
                  AND proposicao_id IS NOT NULL
                ORDER BY proposicao_id
            """)
            ids = [row[0] for row in cur.fetchall()]
            log.info(f"IDs únicos para processar: {len(ids)}")

            # 2. Chama a API
            mapeamento: dict[str, str] = {}
            erros = 0

            for i, vid in enumerate(ids, 1):
                resultado = buscar_proposicao(vid)
                if resultado:
                    mapeamento[vid] = resultado
                    log.info(f"[{i}/{len(ids)}] {vid} → {resultado}")
                else:
                    erros += 1
                    log.warning(f"[{i}/{len(ids)}] {vid} → sem proposição")
                time.sleep(DELAY)

            log.info(f"Mapeados: {len(mapeamento)} | Sem resultado: {erros}")

            # 3. Atualiza em batch
            atualizados = 0
            for vid, prop_texto in mapeamento.items():
                cur.execute("""
                    UPDATE votacoes
                    SET proposicao = %s, atualizado_em = NOW()
                    WHERE proposicao_id = %s
                      AND proposicao IS NULL
                """, (prop_texto, vid))
                atualizados += cur.rowcount

            conn.commit()
            log.info(f"Votos atualizados no banco: {atualizados}")


if __name__ == "__main__":
    main()
