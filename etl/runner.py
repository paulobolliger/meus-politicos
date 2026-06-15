"""
Runner persistente da fila etl_jobs.

Uso:
  python etl/runner.py --once
  python etl/runner.py --poll-seconds 10
"""

import argparse
import json
import logging
import os
import socket
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import psycopg
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / "app" / ".env.local")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("etl-runner")


@dataclass(frozen=True)
class Source:
    script: str
    timeout: int


SOURCES = {
    "camara_deputados": Source("etl/camara/collect_deputados.py", 3600),
    "camara_ceap": Source("etl/camara/collect_camara_gastos.py", 14400),
    "camara_votacoes": Source("etl/camara/collect_votacoes.py", 14400),
    "camara_proposicoes": Source("etl/camara/collect_proposicoes.py", 14400),
    "senado_senadores": Source("etl/senado/collect_senadores.py", 3600),
    "senado_ceap": Source("etl/senado/collect_senado_gastos.py", 14400),
    "senado_votacoes": Source("etl/senado/collect_senado_votacoes.py", 14400),
    "portal_transparencia_emendas": Source("etl/portal_transparencia/collect_emendas.py", 21600),
    "ibge_municipios": Source("etl/ibge/collect_municipios.py", 3600),
    "ibge_estados": Source("etl/ibge/collect_estados_ibge.py", 3600),
    "stn_pacto_federativo": Source("etl/stn/collect_pacto_federativo.py", 7200),
    "stn_financas_municipais": Source("etl/stn/collect_financas.py", 21600),
    "tse_candidatos_2026": Source("etl/tse/collect_candidatos_2026.py", 14400),
}


def connect():
    return psycopg.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        autocommit=False,
    )


def build_args(source: str, params: dict[str, Any]) -> list[str]:
    args: list[str] = []
    if source == "portal_transparencia_emendas":
        for year in params.get("anos", []):
            args.extend(["--ano", str(int(year))])
        args.extend(["--tipo", str(params.get("tipo", "ambos"))])
    else:
        for key in ("ano", "paginas", "tipo", "uf"):
            value = params.get(key)
            if value is not None and value != "":
                args.extend([f"--{key}", str(value)])
    return args


def claim_job(db, runner_id: str):
    with db.cursor() as cur:
        cur.execute(
            """
            UPDATE etl_jobs
            SET status = CASE
                  WHEN tentativas < max_tentativas THEN 'pendente'
                  ELSE 'falhou'
                END,
                disponivel_em = CASE
                  WHEN tentativas < max_tentativas THEN now() + interval '5 minutes'
                  ELSE disponivel_em
                END,
                mensagem = 'Job recuperado após runner inativo',
                runner_id = NULL,
                atualizado_em = now(),
                concluido_em = CASE
                  WHEN tentativas >= max_tentativas THEN now()
                  ELSE concluido_em
                END
            WHERE status = 'em_andamento'
              AND iniciado_em < now() - interval '8 hours'
            """
        )
        cur.execute(
            """
            WITH next_job AS (
              SELECT id FROM etl_jobs
              WHERE status = 'pendente' AND disponivel_em <= now()
              ORDER BY prioridade, criado_em
              FOR UPDATE SKIP LOCKED
              LIMIT 1
            )
            UPDATE etl_jobs j
            SET status = 'em_andamento', runner_id = %s, tentativas = tentativas + 1,
                iniciado_em = now(), atualizado_em = now()
            FROM next_job
            WHERE j.id = next_job.id
            RETURNING j.id, j.fonte, j.parametros, j.tentativas, j.max_tentativas
            """,
            (runner_id,),
        )
        row = cur.fetchone()
    db.commit()
    return row


def finish_job(
    db,
    job_id,
    status: str,
    exit_code: int,
    message: str,
    output: str,
    retry: bool = False,
):
    with db.cursor() as cur:
        if retry:
            cur.execute(
                """
                UPDATE etl_jobs
                SET status = 'pendente', exit_code = %s, mensagem = %s,
                    stdout_resumo = %s, runner_id = NULL,
                    disponivel_em = now() + interval '5 minutes',
                    iniciado_em = NULL, atualizado_em = now()
                WHERE id = %s
                """,
                (exit_code, message[:2000], output[-10000:], job_id),
            )
        else:
            cur.execute(
                """
                UPDATE etl_jobs
                SET status = %s, exit_code = %s, mensagem = %s, stdout_resumo = %s,
                    concluido_em = now(), atualizado_em = now()
                WHERE id = %s
                """,
                (status, exit_code, message[:2000], output[-10000:], job_id),
            )
    db.commit()


def run_job(db, row, runner_id: str):
    job_id, source_name, params, attempts, max_attempts = row
    source = SOURCES.get(source_name)
    if not source:
        finish_job(db, job_id, "falhou", 2, f"Fonte desconhecida: {source_name}", "")
        return

    script = ROOT / source.script
    command = [sys.executable, str(script), *build_args(source_name, params or {})]
    log.info("[%s] Executando %s", job_id, " ".join(command))
    started = time.monotonic()

    try:
        proc = subprocess.run(
            command,
            cwd=ROOT,
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
            capture_output=True,
            text=True,
            timeout=source.timeout,
            encoding="utf-8",
            errors="replace",
        )
        output = f"{proc.stdout}\n{proc.stderr}".strip()
        duration = int(time.monotonic() - started)
        status = "ok" if proc.returncode == 0 else "falhou"
        should_retry = proc.returncode != 0 and attempts < max_attempts
        finish_job(
            db,
            job_id,
            status,
            proc.returncode,
            f"{source_name} finalizado em {duration}s pelo runner {runner_id}",
            output,
            retry=should_retry,
        )
    except subprocess.TimeoutExpired as exc:
        output = f"{exc.stdout or ''}\n{exc.stderr or ''}"
        finish_job(
            db,
            job_id,
            "falhou",
            124,
            f"Timeout após {source.timeout}s",
            output,
            retry=attempts < max_attempts,
        )
    except Exception as exc:
        finish_job(
            db,
            job_id,
            "falhou",
            1,
            f"Erro do runner: {exc}",
            "",
            retry=attempts < max_attempts,
        )


def main():
    parser = argparse.ArgumentParser(description="Runner da fila etl_jobs")
    parser.add_argument("--once", action="store_true")
    parser.add_argument(
        "--poll-seconds",
        type=int,
        default=int(os.getenv("ETL_RUNNER_POLL_SECONDS", "10")),
    )
    args = parser.parse_args()

    runner_id = f"{socket.gethostname()}:{os.getpid()}"
    db = connect()
    log.info("Runner iniciado: %s", runner_id)

    while True:
        try:
            row = claim_job(db, runner_id)
            if row:
                run_job(db, row, runner_id)
            elif args.once:
                break
            else:
                time.sleep(max(1, args.poll_seconds))
        except KeyboardInterrupt:
            break
        except Exception:
            log.exception("Falha no loop do runner")
            try:
                db.rollback()
            except Exception:
                pass
            time.sleep(max(1, args.poll_seconds))

    db.close()


if __name__ == "__main__":
    main()
