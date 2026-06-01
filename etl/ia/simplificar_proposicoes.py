"""
Simplifica ementas de proposicoes usando OpenAI.

Para cada proposicao onde titulo_simplificado IS NULL:
  - Envia a ementa para GPT-4o-mini com o system prompt cívico
  - Recebe JSON com titulo_simplificado + frases_chave (3 bullets)
  - Atualiza o banco

Uso:
  python etl/ia/simplificar_proposicoes.py              # processa 100 por vez
  python etl/ia/simplificar_proposicoes.py --limit 20   # teste com 20
  python etl/ia/simplificar_proposicoes.py --all        # tudo (cuidado: $$$)

Custo estimado:
  gpt-4o-mini ~$0.002 por proposicao
  22.000 proposicoes = ~$44
"""

import os
import sys
import time
import json
import logging
import argparse
import psycopg
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).parent.parent.parent / "app" / ".env.local")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── Conexão Postgres ──────────────────────────────────────────────────────────
CONN_STR = (
    f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
    f"port={os.getenv('POSTGRES_PORT', '5433')} "
    f"dbname={os.getenv('POSTGRES_DB', 'meuspoliticos_db')} "
    f"user={os.getenv('POSTGRES_USER', 'postgres')} "
    f"password={os.getenv('POSTGRES_PASSWORD', '')}"
)

# ── OpenAI ────────────────────────────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL          = "gpt-4o-mini"
DELAY          = 0.4   # segundos entre chamadas (rate limit gentil)

SYSTEM_PROMPT = """
Atues como o tradutor oficial de termos jurídicos e legislativos da plataforma "Meus Políticos".
A tua missão é ler ementas, títulos de Projetos de Lei (PL), PECs ou Decretos altamente complexos
e transformá-los em linguagem extremamente simples, curta e de fácil entendimento para o cidadão
comum (linguagem "dummie").

Deves seguir rigorosamente as seguintes diretrizes:
1. Neutralidade Absoluta: Não emitas juízos de valor, opiniões ou adjetivações.
   Foca-te estritamente no facto político e no impacto prático.
2. Título Curto (Dummie): Cria um título principal muito curto (máximo 8 a 10 palavras)
   que descreva de forma clara e direta o tema central do projeto.
   Evita palavras como "Susta", "Dispositivos", "Regulamenta" ou referências diretas
   a números de leis no título simplificado.
3. Frases-Chave (Bullets de Impacto): Gera exatamente 3 frases curtas e diretas que
   sintetizem a ação central e o impacto prático do projeto na vida do cidadão ou do município.
   Cada frase deve funcionar de forma isolada como um ponto fulcral de leitura rápida.

A tua resposta deve ser OBRIGATORIAMENTE um objeto JSON estruturado com as seguintes chaves
(não adiciones nenhuma introdução ou conclusão, responde apenas com o JSON puro):

{
  "titulo_simplificado": "String contendo o título dummie",
  "frases_chave": [
    "Primeira frase-chave de ação ou impacto",
    "Segunda frase-chave de ação ou impacto",
    "Terceira frase-chave de ação ou impacto"
  ]
}
""".strip()


# ── Funções ───────────────────────────────────────────────────────────────────

def simplificar(client: OpenAI, ementa: str) -> dict | None:
    """Chama a API e retorna {'titulo_simplificado': str, 'frases_chave': list[str]} ou None."""
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": ementa.strip()},
            ],
            temperature=0.4,
            max_tokens=300,
        )
        raw = resp.choices[0].message.content or ""
        data = json.loads(raw)

        titulo  = data.get("titulo_simplificado", "").strip()
        frases  = data.get("frases_chave", [])

        if not titulo or len(frases) < 1:
            log.warning(f"Resposta incompleta da IA: {raw[:120]}")
            return None

        # Garante exatamente 3 frases (pad ou trim)
        frases = [str(f).strip() for f in frases[:3]]
        while len(frases) < 3:
            frases.append("")

        return {"titulo_simplificado": titulo, "frases_chave": frases}

    except json.JSONDecodeError as e:
        log.warning(f"JSON inválido da IA: {e}")
        return None
    except Exception as e:
        log.warning(f"Erro na chamada OpenAI: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Simplifica ementas via OpenAI")
    parser.add_argument("--limit", type=int, default=100, help="Max proposicoes a processar (default: 100)")
    parser.add_argument("--all",   action="store_true",   help="Processar todas (ignora --limit)")
    args = parser.parse_args()

    if not OPENAI_API_KEY:
        log.error("OPENAI_API_KEY não encontrada em .env.local")
        sys.exit(1)

    client = OpenAI(api_key=OPENAI_API_KEY)
    limit  = None if args.all else args.limit

    with psycopg.connect(CONN_STR) as conn:
        with conn.cursor() as cur:

            # 1. Buscar proposicoes pendentes
            query = """
                SELECT id, tipo, numero, ano, ementa
                FROM proposicoes
                WHERE titulo_simplificado IS NULL
                  AND ementa IS NOT NULL
                  AND ementa != ''
                ORDER BY data_apresentacao DESC NULLS LAST
            """
            if limit:
                query += f" LIMIT {limit}"

            cur.execute(query)
            rows = cur.fetchall()
            log.info(f"Proposicoes a processar: {len(rows)}")

            if not rows:
                log.info("Nenhuma proposicao pendente. Encerrando.")
                return

            # 2. Processar cada uma
            ok = 0
            erros = 0

            for i, (pid, tipo, numero, ano, ementa) in enumerate(rows, 1):
                ref = f"{tipo} {numero}/{ano}"
                resultado = simplificar(client, ementa)

                if resultado:
                    cur.execute(
                        """UPDATE proposicoes
                           SET titulo_simplificado = %s,
                               frases_chave        = %s,
                               atualizado_em       = NOW()
                           WHERE id = %s""",
                        (
                            resultado["titulo_simplificado"],
                            resultado["frases_chave"],   # psycopg converte list → text[]
                            pid,
                        ),
                    )
                    ok += 1
                    log.info(f"[{i}/{len(rows)}] {ref} → {resultado['titulo_simplificado']}")
                else:
                    erros += 1
                    log.warning(f"[{i}/{len(rows)}] {ref} → sem resultado")

                # Commit a cada 10 para não perder tudo se interromper
                if i % 10 == 0:
                    conn.commit()
                    log.info(f"  → commit parcial ({ok} ok, {erros} erros)")

                time.sleep(DELAY)

            conn.commit()
            log.info(f"Concluído: {ok} simplificados | {erros} erros")


if __name__ == "__main__":
    main()
