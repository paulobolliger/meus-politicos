import os
import io
import csv
import time
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv
import psycopg

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

ANOS = [2023, 2024, 2025]

MAPA_VOTO = {
    'Sim':       'sim',
    'Não':       'nao',
    'Abstenção': 'abstencao',
    'Obstrução': 'obstrucao',
    'Art. 17':   'artigo_17',
    'Ausente':   'ausente',
}


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable'
    )


def get_or_reconnect(conn):
    try:
        conn.execute("SELECT 1")
        return conn
    except Exception:
        log.info("Reconectando...")
        try:
            conn.close()
        except:
            pass
        return get_db()


def buscar_mapa_deputados(cur):
    cur.execute("""
        SELECT id_camara, id FROM politicos
        WHERE cargo = 'deputado_federal'
          AND id_camara IS NOT NULL
          AND removido_em IS NULL
    """)
    return {str(row[0]): row[1] for row in cur.fetchall()}


def baixar_csv(url, tentativas=5):
    import tempfile, os
    nome_arquivo = url.split('/')[-1]
    caminho = os.path.join(tempfile.gettempdir(), nome_arquivo)

    for tentativa in range(tentativas):
        try:
            log.info(f"Baixando {url}... (tentativa {tentativa+1})")
            r = requests.get(url, timeout=300, stream=True)
            r.raise_for_status()

            bytes_baixados = 0
            with open(caminho, 'wb') as f:
                for chunk in r.iter_content(chunk_size=131072):
                    if chunk:
                        f.write(chunk)
                        bytes_baixados += len(chunk)

            log.info(f"Download concluido: {bytes_baixados/1024/1024:.1f}MB")
            with open(caminho, 'r', encoding='utf-8', errors='replace') as f:
                return f.read()

        except Exception as e:
            log.warning(f"Tentativa {tentativa+1} falhou: {e}")
            if os.path.exists(caminho):
                os.remove(caminho)
            if tentativa < tentativas - 1:
                time.sleep(10)
            else:
                raise


def processar_ano(cur, conn, ano, mapa_deputados):
    # 1. Baixar e indexar votações com descrição
    url_votacoes = f"https://dadosabertos.camara.leg.br/arquivos/votacoes/csv/votacoes-{ano}.csv"
    conteudo_vot = baixar_csv(url_votacoes)
    reader = csv.reader(io.StringIO(conteudo_vot), delimiter=';')
    next(reader)

    votacoes = {}
    for row in reader:
        if len(row) < 14:
            continue
        id_vot = row[0].strip().strip('"')
        data_str = row[2].strip().strip('"')
        descricao = row[13].strip().strip('"')[:500]
        aprovacao = row[9].strip().strip('"')
        try:
            mes = int(data_str[5:7])
        except:
            mes = None
        votacoes[id_vot] = {
            'data': data_str,
            'mes': mes,
            'descricao': descricao,
            'aprovacao': aprovacao == '1'
        }

    log.info(f"Ano {ano}: {len(votacoes)} votações indexadas")

    # 2. Baixar votos individuais
    url_votos = f"https://dadosabertos.camara.leg.br/arquivos/votacoesVotos/csv/votacoesVotos-{ano}.csv"
    conteudo_votos = baixar_csv(url_votos)
    reader2 = csv.reader(io.StringIO(conteudo_votos), delimiter=';')
    next(reader2)

    batch = []
    total = 0
    erros = 0

    for row in reader2:
        if len(row) < 5:
            continue

        id_votacao = row[0].strip().strip('"')
        id_deputado = row[4].strip().strip('"')
        voto_raw = row[3].strip().strip('"')
        data_hora = row[2].strip().strip('"')

        politico_id = mapa_deputados.get(id_deputado)
        if not politico_id:
            continue

        vot = votacoes.get(id_votacao, {})
        voto_enum = MAPA_VOTO.get(voto_raw, 'ausente')
        data = vot.get('data', data_hora[:10] if data_hora else None)

        source_record_id = f"{id_votacao}_{id_deputado}"

        batch.append((
            politico_id,
            data,
            vot.get('descricao', ''),
            voto_enum,
            id_votacao,
            source_record_id,
        ))

        if len(batch) >= 500:
            conn, cur, n = flush_batch(conn, cur, batch)
            total += n
            batch = []
            if total % 50000 == 0:
                log.info(f"  {ano}: {total} votos inseridos...")

    if batch:
        conn, cur, n = flush_batch(conn, cur, batch)
        total += n

    # 3. Atualizar total_votacoes em politicos
    conn = get_or_reconnect(conn)
    cur = conn.cursor()
    cur.execute("""
        UPDATE politicos p
        SET total_votacoes = (
            SELECT COUNT(DISTINCT v.proposicao_id)
            FROM votacoes v
            WHERE v.politico_id = p.id
              AND v.source_id = 'camara_votos_bulk'
        ),
        atualizado_em = now()
        WHERE cargo = 'deputado_federal'
    """)
    conn.commit()

    log.info(f"Ano {ano}: {total} votos inseridos · {erros} erros")
    return total, conn, cur


def flush_batch(conn, cur, rows):
    conn = get_or_reconnect(conn)
    cur = conn.cursor()
    try:
        cur.executemany("""
            INSERT INTO votacoes (
                politico_id, data, descricao_simples,
                voto, proposicao_id,
                dado_estado, source_id, source_record_id,
                link_fonte, collected_at
            )
            VALUES (%s,%s,%s,%s::voto_tipo,%s,'oficial','camara_votos_bulk',%s,NULL,now())
            ON CONFLICT (source_id, source_record_id)
            DO UPDATE SET
                voto         = EXCLUDED.voto,
                collected_at = now()
        """, rows)
        conn.commit()
        return conn, cur, len(rows)
    except Exception as e:
        log.warning(f"Erro batch votos: {e}")
        try:
            conn.rollback()
        except:
            pass
        return get_db(), get_db().cursor(), 0


def main():
    inicio = datetime.now()
    conn = get_db()
    cur = conn.cursor()
    total = 0

    try:
        # Garantir constraint
        cur.execute("""
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'votacoes_source_unique'
              ) THEN
                ALTER TABLE votacoes
                  ADD CONSTRAINT votacoes_source_unique
                  UNIQUE (source_id, source_record_id);
              END IF;
            END $$;
        """)
        conn.commit()

        mapa = buscar_mapa_deputados(cur)
        log.info(f"Mapa de {len(mapa)} deputados carregado")

        for ano in ANOS:
            t, conn, cur = processar_ano(cur, conn, ano, mapa)
            total += t
            time.sleep(1)

        duracao = int((datetime.now() - inicio).total_seconds() * 1000)
        cur.execute("""
            INSERT INTO coletas_log
                (fonte, tipo, status, registros, duracao_ms, mensagem, iniciado_em, concluido_em)
            VALUES ('camara_votos_bulk','votacoes','ok',%s,%s,%s,now(),now())
        """, (total, duracao, f"{total} votos inseridos"))
        conn.commit()
        log.info(f"✅ Concluído: {total} votos em {duracao}ms")

    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        log.error(f"❌ Erro: {e}")
        raise
    finally:
        try:
            cur.close()
            conn.close()
        except:
            pass


if __name__ == '__main__':
    main()
