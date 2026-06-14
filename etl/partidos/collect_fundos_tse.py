"""
ETL — Fundo Partidário (FP) e Fundo Eleitoral/FEFC por partido
Fonte: TSE CDN (open data, sem API key)

Coleta:
  FEFC  → fefc_fp_{ano}.zip / fefc_genero_{ano}.csv   (anos eleitorais: 2022, 2024, 2026...)
  FP    → extrato_bancario_partido_{ano}.zip           (anual)

Atualiza tabela partidos:
  fp_ultimo_valor  / fp_ultimo_ano
  fefc_ultimo_valor / fefc_ultimo_ano

Histórico em:
  partidos_fundos (tipo, ano, valor)

Uso:
  python collect_fundos_tse.py              # ano corrente + 2022/2024
  python collect_fundos_tse.py --ano 2022
"""

import os, sys, io, csv, zipfile, requests, argparse, logging
from collections import defaultdict
from datetime import datetime

import psycopg
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local'))

DSN = (
    f"host={os.getenv('POSTGRES_HOST','localhost')} "
    f"port={os.getenv('POSTGRES_PORT','5433')} "
    f"dbname={os.getenv('POSTGRES_DB','meuspoliticos_db')} "
    f"user={os.getenv('POSTGRES_USER','postgres')} "
    f"password={os.getenv('POSTGRES_PASSWORD','')}"
)

TSE_CDN = 'https://cdn.tse.jus.br/estatistica/sead/odsele'

SESSION = requests.Session()
SESSION.headers['User-Agent'] = 'MeusPoliticos/1.0 (contato@meuspoliticos.com.br)'


# ─── Helpers ──────────────────────────────────────────────────────────────────

def parse_br(v: str) -> float:
    """Converte '1.234,56' → 1234.56"""
    try:
        return float(v.strip().replace('.', '').replace(',', '.'))
    except Exception:
        return 0.0


def baixar_zip(url: str) -> zipfile.ZipFile | None:
    log.info('GET %s', url)
    try:
        r = SESSION.get(url, timeout=180, stream=True)
        r.raise_for_status()
    except Exception as e:
        log.warning('Erro ao baixar %s: %s', url, e)
        return None

    buf = io.BytesIO()
    for chunk in r.iter_content(65536):
        buf.write(chunk)
    buf.seek(0)
    try:
        return zipfile.ZipFile(buf)
    except zipfile.BadZipFile:
        log.warning('Arquivo não é um ZIP válido: %s', url)
        return None


# ─── FEFC ─────────────────────────────────────────────────────────────────────

def coletar_fefc(ano: int) -> dict[str, float]:
    """
    Retorna {sigla: valor_alocado_fefc} para um ano eleitoral.
    Usa MAX(VR_PARTIDO_FEFC) pois o valor é repetido por gênero.
    """
    url = f'{TSE_CDN}/fefc_fp/fefc_fp_{ano}.zip'
    z = baixar_zip(url)
    if z is None:
        return {}

    fname = f'fefc_genero_{ano}.csv'
    if fname not in z.namelist():
        log.warning('%s não encontrado no ZIP', fname)
        return {}

    fefc: dict[str, float] = {}
    with z.open(fname) as f:
        reader = csv.DictReader(io.TextIOWrapper(f, encoding='latin-1'), delimiter=';')
        for row in reader:
            sg = row.get('SG_PARTIDO', '').strip()
            if not sg:
                continue
            v = parse_br(row.get('VR_PARTIDO_FEFC', '0'))
            fefc[sg] = max(fefc.get(sg, 0.0), v)

    log.info('FEFC %d: %d partidos coletados', ano, len(fefc))
    return fefc


# ─── Fundo Partidário ──────────────────────────────────────────────────────────

def coletar_fp(ano: int) -> dict[str, float]:
    """
    Retorna {sigla: valor_fp_nacional} para um ano.
    Filtra: créditos (C) no diretório Nacional com CD_FONTE_RECURSO = '1' (Fundo Partidário).
    """
    url = f'{TSE_CDN}/prestacao_contas_anual_partidaria/extrato_bancario_partido_{ano}.zip'
    z = baixar_zip(url)
    if z is None:
        return {}

    fname = f'extrato_bancario_partido_{ano}.csv'
    if fname not in z.namelist():
        log.warning('%s não encontrado no ZIP', fname)
        return {}

    fp: dict[str, float] = defaultdict(float)
    n_total = 0
    n_fp = 0

    with z.open(fname) as f:
        reader = csv.DictReader(io.TextIOWrapper(f, encoding='latin-1'), delimiter=';')
        for row in reader:
            n_total += 1
            if row.get('TP_LANCAMENTO') != 'C':
                continue
            if row.get('NM_ESFERA') != 'Nacional':
                continue
            if row.get('CD_FONTE_RECURSO', '').strip() != '1':
                continue  # apenas FP puro (não misturado com outros)
            sg = row.get('SG_PARTIDO', '').strip()
            if not sg:
                continue
            v = parse_br(row.get('VR_LANCAMENTO', '0'))
            fp[sg] += v
            n_fp += 1

    log.info('FP %d: %d linhas, %d créditos FP, %d partidos', ano, n_total, n_fp, len(fp))
    return dict(fp)


# ─── Persistência ─────────────────────────────────────────────────────────────

MIGRATION = """
CREATE TABLE IF NOT EXISTS partidos_fundos (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    partido_id  uuid NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
    tipo        text NOT NULL CHECK (tipo IN ('fp', 'fefc')),
    ano         integer NOT NULL CHECK (ano >= 1995),
    valor       numeric(18,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
    coletado_em timestamptz NOT NULL DEFAULT now(),
    UNIQUE (partido_id, tipo, ano)
);

ALTER TABLE partidos
    ADD COLUMN IF NOT EXISTS fp_ultimo_valor    numeric(18,2),
    ADD COLUMN IF NOT EXISTS fp_ultimo_ano      integer,
    ADD COLUMN IF NOT EXISTS fefc_ultimo_valor  numeric(18,2),
    ADD COLUMN IF NOT EXISTS fefc_ultimo_ano    integer;
"""


def normalizar_sigla(sigla: str) -> str:
    """Remove acentos para comparação."""
    import unicodedata
    return unicodedata.normalize('NFD', sigla).encode('ascii', 'ignore').decode().upper()


def persistir(conn: psycopg.Connection, tipo: str, ano: int, dados: dict[str, float]) -> None:
    if not dados:
        return

    with conn.cursor() as cur:
        # Mapa sigla → partido_id (normalizado)
        cur.execute('SELECT id, sigla FROM partidos')
        mapa = {normalizar_sigla(r[1]): r[0] for r in cur.fetchall()}

        ok, miss = 0, []
        for sigla, valor in dados.items():
            pid = mapa.get(normalizar_sigla(sigla))
            if pid is None:
                miss.append(sigla)
                continue

            # Histórico
            cur.execute("""
                INSERT INTO partidos_fundos (partido_id, tipo, ano, valor)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (partido_id, tipo, ano) DO UPDATE
                  SET valor = EXCLUDED.valor, coletado_em = now()
            """, (pid, tipo, ano, valor))

            # Agregado na tabela partidos (só atualiza se o ano for >= ao atual)
            if tipo == 'fp':
                cur.execute("""
                    UPDATE partidos
                    SET fp_ultimo_valor = %s, fp_ultimo_ano = %s
                    WHERE id = %s
                      AND (fp_ultimo_ano IS NULL OR fp_ultimo_ano <= %s)
                """, (valor, ano, pid, ano))
            else:
                cur.execute("""
                    UPDATE partidos
                    SET fefc_ultimo_valor = %s, fefc_ultimo_ano = %s
                    WHERE id = %s
                      AND (fefc_ultimo_ano IS NULL OR fefc_ultimo_ano <= %s)
                """, (valor, ano, pid, ano))

            ok += 1

        conn.commit()
        log.info('%s %d: %d salvos, %d não encontrados: %s', tipo.upper(), ano, ok, len(miss), miss[:10])


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--ano', type=int, help='Ano específico (default: coleta todos)')
    parser.add_argument('--tipo', choices=['fp', 'fefc', 'ambos'], default='ambos')
    args = parser.parse_args()

    ano_atual = datetime.now().year

    # Anos eleitorais disponíveis para FEFC (eleições a cada 2 anos)
    anos_eleitorais = [a for a in range(2022, ano_atual + 1, 2)]
    # Anos disponíveis para FP (anual)
    anos_fp = list(range(2022, ano_atual + 1))

    if args.ano:
        anos_eleitorais = [args.ano] if args.ano % 2 == 0 else []
        anos_fp = [args.ano]

    with psycopg.connect(DSN) as conn:
        # Migration
        log.info('Aplicando migration...')
        with conn.cursor() as cur:
            cur.execute(MIGRATION)
        conn.commit()

        # FP
        if args.tipo in ('fp', 'ambos'):
            for ano in anos_fp:
                log.info('=== Fundo Partidário %d ===', ano)
                dados = coletar_fp(ano)
                persistir(conn, 'fp', ano, dados)

        # FEFC
        if args.tipo in ('fefc', 'ambos'):
            for ano in anos_eleitorais:
                log.info('=== FEFC %d ===', ano)
                dados = coletar_fefc(ano)
                persistir(conn, 'fefc', ano, dados)

    log.info('Concluído.')


if __name__ == '__main__':
    main()
