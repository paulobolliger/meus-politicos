import os
import time
import logging
import psycopg
import requests

from datetime import datetime
from dotenv import load_dotenv
from unidecode import unidecode


# Carrega .env.local da raiz do monorepo
load_dotenv(
    os.path.join(
        os.path.dirname(__file__),
        '..',
        '..',
        '.env.local'
    )
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)

log = logging.getLogger(__name__)

BASE_URL = "https://dadosabertos.camara.leg.br/api/v2"


def get_db():
    return psycopg.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        user=os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='prefer'
    )


def gerar_slug(nome, uf):
    nome_limpo = (
        unidecode(nome)
        .lower()
        .replace(' ', '-')
        .replace('.', '')
    )

    return f"{nome_limpo}-dep-federal-{uf.lower()}"


def detectar_plataforma(url):
    url = url.lower()

    if 'instagram.com' in url:
        return 'instagram'

    if 'twitter.com' in url or 'x.com' in url:
        return 'twitter_x'

    if 'youtube.com' in url:
        return 'youtube'

    if 'facebook.com' in url:
        return 'facebook'

    if 'tiktok.com' in url:
        return 'tiktok'

    return 'site_oficial'


def buscar_deputados():
    deputados = []
    pagina = 1

    while True:
        r = requests.get(
            f"{BASE_URL}/deputados",
            params={
                'ordem': 'ASC',
                'ordenarPor': 'nome',
                'itens': 100,
                'pagina': pagina
            }
        )

        data = r.json().get('dados', [])

        if not data:
            break

        deputados.extend(data)

        log.info(
            f"Página {pagina} — "
            f"{len(deputados)} deputados até agora"
        )

        pagina += 1

        time.sleep(0.3)

    return deputados


def buscar_detalhe(id_camara):
    r = requests.get(f"{BASE_URL}/deputados/{id_camara}")
    return r.json().get('dados', {})


def upsert_partido(cur, sigla, nome):
    cur.execute("""
        INSERT INTO partidos (sigla, nome)
        VALUES (%s, %s)
        ON CONFLICT (sigla) DO NOTHING
        RETURNING id
    """, (sigla, nome or sigla))

    row = cur.fetchone()

    if row:
        return row[0]

    cur.execute(
        "SELECT id FROM partidos WHERE sigla = %s",
        (sigla,)
    )

    return cur.fetchone()[0]


def upsert_politico(cur, d, partido_id):
    status = d.get('ultimoStatus', {})
    gabinete = status.get('gabinete', {}) or {}
    slug = gerar_slug(
        status.get('nomeEleitoral') or d.get('nomeCivil', ''),
        d['uf']
    )

    cur.execute("""
        INSERT INTO politicos (
            id_camara, nome, nome_civil, nome_eleitoral,
            email, gabinete_email, gabinete_telefone, gabinete_nome,
            data_nascimento, naturalidade, uf_nascimento,
            sexo, data_falecimento, escolaridade, ocupacao,
            mandato_inicio, foto_url, cargo, uf,
            partido_id, slug, source_id, source_record_id, collected_at
        )
        VALUES (
            %s,%s,%s,%s,
            %s,%s,%s,%s,
            %s,%s,%s,
            %s,%s,%s,%s,
            %s,%s,
            'deputado_federal',%s,
            %s,%s,'camara_deputados',%s,now()
        )
        ON CONFLICT (id_camara) DO UPDATE SET
            nome            = EXCLUDED.nome,
            nome_eleitoral  = EXCLUDED.nome_eleitoral,
            email           = EXCLUDED.email,
            gabinete_email  = EXCLUDED.gabinete_email,
            gabinete_telefone = EXCLUDED.gabinete_telefone,
            gabinete_nome   = EXCLUDED.gabinete_nome,
            naturalidade    = EXCLUDED.naturalidade,
            uf_nascimento   = EXCLUDED.uf_nascimento,
            sexo            = EXCLUDED.sexo,
            data_falecimento = EXCLUDED.data_falecimento,
            ocupacao        = EXCLUDED.ocupacao,
            mandato_inicio  = EXCLUDED.mandato_inicio,
            foto_url        = EXCLUDED.foto_url,
            partido_id      = EXCLUDED.partido_id,
            collected_at    = now()
        RETURNING id
    """, (
        d['id'],
        d.get('nomeCivil', ''),
        d.get('nomeCivil', ''),
        status.get('nomeEleitoral') or d.get('nomeCivil', ''),
        gabinete.get('email') or status.get('email') or None,
        gabinete.get('email') or None,
        gabinete.get('telefone') or None,
        gabinete.get('nome') or None,
        d.get('dataNascimento') or None,
        d.get('municipioNascimento') or None,
        d.get('ufNascimento') or None,
        d.get('sexo') or None,
        d.get('dataFalecimento') or None,
        d.get('escolaridade') or None,
        status.get('descricaoOcupacao') or None,
        status.get('dataInicio') or None,
        status.get('urlFoto') or None,
        d['uf'],
        partido_id,
        slug,
        str(d['id'])
    ))
    return cur.fetchone()[0]


def upsert_redes(cur, politico_id, redes):

    for url in redes:

        if not url:
            continue

        plataforma = detectar_plataforma(url)

        cur.execute("""
            INSERT INTO redes_sociais (
                politico_id,
                plataforma,
                url
            )
            VALUES (%s, %s, %s)

            ON CONFLICT (
                politico_id,
                plataforma
            )
            DO NOTHING
        """, (
            politico_id,
            plataforma,
            url
        ))


def main():

    inicio = datetime.now()

    conn = get_db()
    cur = conn.cursor()

    total = 0

    try:

        deputados = buscar_deputados()

        log.info(
            f"Total a processar: {len(deputados)}"
        )

        for i, dep in enumerate(deputados):

            try:

                detalhe = buscar_detalhe(dep['id'])

                sigla = detalhe.get(
                    'ultimoStatus',
                    {}
                ).get(
                    'siglaPartido',
                    'SEM_PARTIDO'
                )

                partido_id = upsert_partido(
                    cur,
                    sigla,
                    sigla
                )

                uf = detalhe.get(
                    'ultimoStatus',
                    {}
                ).get(
                    'siglaUf',
                    ''
                )

                detalhe['uf'] = uf

                politico_id = upsert_politico(
                    cur,
                    detalhe,
                    partido_id
                )

                redes = detalhe.get(
                    'redeSocial',
                    []
                )

                upsert_redes(
                    cur,
                    politico_id,
                    redes
                )

                conn.commit()

                total += 1

                if (i + 1) % 50 == 0:
                    log.info(
                        f"Progresso: "
                        f"{i+1}/{len(deputados)}"
                    )

                time.sleep(0.3)

            except Exception as e:

                conn.rollback()

                log.error(
                    f"Erro no deputado "
                    f"{dep['id']}: {e}"
                )

        duracao = int(
            (
                datetime.now() - inicio
            ).total_seconds() * 1000
        )

        cur.execute("""
            INSERT INTO coletas_log (
                fonte,
                tipo,
                status,
                registros,
                duracao_ms,
                mensagem,
                iniciado_em,
                concluido_em
            )

            VALUES (
                'camara_deputados',
                'deputados',
                'ok',
                %s,
                %s,
                %s,
                %s,
                now()
            )
        """, (
            total,
            duracao,
            f"{total} deputados inseridos",
            inicio
        ))

        conn.commit()

        log.info(
            f"Concluído: "
            f"{total} deputados "
            f"em {duracao}ms"
        )

    except Exception as e:

        log.error(f"Erro geral: {e}")

    finally:

        cur.close()
        conn.close()


if __name__ == '__main__':
    main()