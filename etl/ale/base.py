"""
base.py — Utilitários compartilhados entre todos os ETLs de ALEs.

Importar com:
    from etl.ale.base import get_db, get_or_reconnect, buscar_mapa_deputados_uf, slugify, MAPA_VOTO
"""

import os
import re
import logging
import time
import requests
from datetime import date, datetime
from typing import Optional
from dotenv import load_dotenv
import psycopg
from unidecode import unidecode

# ── Configuração ──────────────────────────────────────────────────────────────
_ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local')
load_dotenv(_ENV_PATH)

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

# ── Constantes ────────────────────────────────────────────────────────────────
MAPA_VOTO = {
    # Português normalizado → enum do banco
    'sim':        'sim',
    'não':        'nao',
    'nao':        'nao',
    'abstenção':  'abstencao',
    'abstencao':  'abstencao',
    'abstenção':  'abstencao',
    'obstrução':  'obstrucao',
    'obstrucao':  'obstrucao',
    'ausente':    'ausente',
    'faltou':     'ausente',
    'falta':      'ausente',
    # Inglês / abreviações que alguns portais usam
    'yes':        'sim',
    'no':         'nao',
    'abstain':    'abstencao',
    'absent':     'ausente',
    # ALMG específico
    'aprovação':  'sim',
    'rejeição':   'nao',
}

MAPA_JUSTIFICATIVA = {
    'licença médica':     'licenca_medica',
    'licença medica':     'licenca_medica',
    'missão oficial':     'missao_oficial',
    'missao oficial':     'missao_oficial',
    'licença especial':   'licenca_especial',
    'licença maternidade': 'licenca_maternidade',
    'licença paternidade': 'licenca_paternidade',
    'luto':               'luto',
    'falecimento':        'luto',
}


# ── Banco de dados ────────────────────────────────────────────────────────────

def get_db() -> psycopg.Connection:
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable'
    )


def get_or_reconnect(conn: psycopg.Connection) -> psycopg.Connection:
    try:
        conn.execute("SELECT 1")
        return conn
    except Exception:
        log.info("Reconectando ao banco...")
        try:
            conn.close()
        except Exception:
            pass
        return get_db()


def buscar_mapa_deputados_uf(cur, uf: str) -> dict[str, object]:
    """
    Retorna {id_ale: politico_uuid} para deputados estaduais de uma UF.
    Tenta id_ale primeiro; tem fallback de match por nome.
    """
    cur.execute("""
        SELECT id_ale, id, nome_eleitoral, slug
        FROM politicos
        WHERE cargo = 'deputado_estadual'
          AND uf = %s
          AND removido_em IS NULL
    """, (uf.upper(),))
    rows = cur.fetchall()
    mapa = {}
    for id_ale, uuid, nome, slug in rows:
        if id_ale:
            mapa[str(id_ale)] = uuid
    return mapa


def buscar_politico_por_nome(cur, nome: str, uf: str) -> Optional[object]:
    """
    Fuzzy match de político por nome normalizado (sem acentos, sem case).
    Retorna politico_uuid ou None.
    """
    nome_norm = unidecode(nome).lower().strip()
    cur.execute("""
        SELECT id, nome_eleitoral
        FROM politicos
        WHERE cargo = 'deputado_estadual'
          AND uf = %s
          AND removido_em IS NULL
    """, (uf.upper(),))
    rows = cur.fetchall()
    for uuid, nome_db in rows:
        if unidecode(nome_db or '').lower().strip() == nome_norm:
            return uuid
    return None


# ── Strings e slugs ───────────────────────────────────────────────────────────

def slugify(texto: str) -> str:
    """Transforma texto em slug URL-safe (minúsculo, sem acentos, hífens)."""
    texto = unidecode(texto).lower()
    texto = re.sub(r'[^a-z0-9]+', '-', texto)
    return texto.strip('-')


def normalizar_voto(voto_raw: str) -> Optional[str]:
    """Normaliza string de voto para o enum do banco."""
    if not voto_raw:
        return None
    chave = unidecode(voto_raw).lower().strip()
    return MAPA_VOTO.get(chave) or MAPA_VOTO.get(voto_raw.lower().strip())


def normalizar_justificativa(just_raw: Optional[str]) -> Optional[str]:
    if not just_raw:
        return None
    chave = just_raw.lower().strip()
    for k, v in MAPA_JUSTIFICATIVA.items():
        if k in chave:
            return v
    return None


def parse_data(s: Optional[str], formatos=('%Y-%m-%d', '%d/%m/%Y', '%Y/%m/%d', '%d-%m-%Y')) -> Optional[date]:
    if not s:
        return None
    for fmt in formatos:
        try:
            return datetime.strptime(s[:10], fmt).date()
        except ValueError:
            continue
    return None


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def get_json(url: str, params: dict = None, headers: dict = None,
             tentativas: int = 5, pausa: float = 1.0) -> Optional[dict | list]:
    """GET JSON com retry exponencial."""
    h = {'Accept': 'application/json', 'User-Agent': 'MeusPoliticosBR/1.0'}
    if headers:
        h.update(headers)
    for i in range(tentativas):
        try:
            r = requests.get(url, params=params, headers=h, timeout=30)
            r.raise_for_status()
            try:
                return r.json()
            except ValueError as e:
                log.warning(f"Resposta de {url} não é um JSON válido: {e}")
                return None
        except requests.exceptions.HTTPError as e:
            log.warning(f"HTTP {e.response.status_code} em {url} (tentativa {i+1})")
            if e.response.status_code in (404, 400):
                return None
        except Exception as e:
            log.warning(f"Erro em {url}: {e} (tentativa {i+1})")
        time.sleep(pausa * (2 ** i))
    log.error(f"Desistindo de {url} após {tentativas} tentativas")
    return None


# ── Log de coleta ─────────────────────────────────────────────────────────────

def registrar_coleta(cur, fonte: str, entidade: str, registros: int,
                     status: str = 'ok', mensagem: str = '') -> None:
    cur.execute("""
        INSERT INTO coletas_log (fonte, tipo, registros, status, mensagem)
        VALUES (%s, %s, %s, %s, %s)
    """, (fonte, entidade, registros, status, mensagem[:1000]))
