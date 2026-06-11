"""
ETL de Secretarias Estaduais para os 27 Estados.
Coleta e insere secretarias estruturadas de Saúde, Educação, Segurança Pública,
Fazenda e Planejamento para todas as UFs do Brasil, resolvendo fotos via Wikidata.

Uso:
  .venv/Scripts/python.exe etl/estados/collect_secretarias.py
"""

import json
import logging
import os
import time
import urllib.request
import urllib.parse
import psycopg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

# Carrega a base de dados expandida do JSON
seed_path = os.path.join(os.path.dirname(__file__), 'secretarias_seed.json')
with open(seed_path, 'r', encoding='utf-8') as f:
    SECRETARIAS_SEED = json.load(f)


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable',
    )


def fetch_wikidata_photo(name):
    """
    Busca no Wikidata pelo nome do secretário para obter seu retrato no Commons.
    Retorna a URL do Special:FilePath caso encontrada, ou None.
    """
    try:
        # 1. Buscar a entidade pelo nome no Wikidata API
        search_query = urllib.parse.quote(name)
        search_url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={search_query}&language=pt&format=json"

        # User-Agent em conformidade com as políticas Wikimedia
        headers = {
            'User-Agent': 'MeusPoliticosBot/2.0 (https://meus-politicos.org; contato@meus-politicos.org) python-urllib/3.10'
        }
        req = urllib.request.Request(search_url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode('utf-8'))

        search_results = res.get('search', [])
        if not search_results:
            return None

        # Pegar o primeiro resultado e buscar claims (especialmente P18 - image)
        entity_id = search_results[0]['id']
        entity_url = f"https://www.wikidata.org/w/api.php?action=wbgetentities&ids={entity_id}&props=claims&format=json"

        req_entity = urllib.request.Request(entity_url, headers=headers)
        with urllib.request.urlopen(req_entity, timeout=5) as entity_response:
            entity_data = json.loads(entity_response.read().decode('utf-8'))

        claims = entity_data.get('entities', {}).get(entity_id, {}).get('claims', {})
        image_claims = claims.get('P18', [])

        if image_claims:
            # Pegar o nome do arquivo no Commons
            filename = image_claims[0]['mainsnak']['datavalue']['value']
            encoded_filename = urllib.parse.quote(filename)
            # URL de redirecionamento direto do Wikimedia Commons
            photo_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{encoded_filename}?width=150"
            return photo_url

    except Exception as e:
        log.warning(f"Erro ao buscar foto para {name}: {e}")

    return None


def seed_secretarias(cur):
    log.info("Limpando registros antigos de secretarias...")
    cur.execute("DELETE FROM estados_secretarias")

    log.info("Inserindo novas secretarias estaduais enriquecidas com Wikidata...")
    total_inserido = 0

    for sigla, secretarias in SECRETARIAS_SEED.items():
        log.info(f"Processando secretarias de {sigla}...")
        for sec in secretarias:
            nome = sec['nome']
            secretario_nome = sec['secretario_nome']
            competencia = sec.get('competencia')
            endereco = sec.get('endereco')
            site_oficial = sec.get('site_oficial')
            email = sec.get('email')
            telefone = sec.get('telefone')

            # Tenta encontrar a foto do secretário no Commons/Wikidata
            foto_url = fetch_wikidata_photo(secretario_nome)

            # Atraso sutil para respeitar limites de taxa (rate limits) da API Wikimedia
            time.sleep(0.3)

            cur.execute(
                """
                INSERT INTO estados_secretarias 
                    (sigla, nome, secretario_nome, competencia, endereco, site_oficial, email, telefone, foto_secretario_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (sigla, nome) DO UPDATE 
                SET secretario_nome = EXCLUDED.secretario_nome,
                    competencia = EXCLUDED.competencia,
                    endereco = EXCLUDED.endereco,
                    site_oficial = EXCLUDED.site_oficial,
                    email = EXCLUDED.email,
                    telefone = EXCLUDED.telefone,
                    foto_secretario_url = COALESCE(EXCLUDED.foto_secretario_url, estados_secretarias.foto_secretario_url),
                    atualizado_em = CURRENT_TIMESTAMP
                """,
                (sigla, nome, secretario_nome, competencia, endereco, site_oficial, email, telefone, foto_url)
            )
            total_inserido += 1

    log.info(f"Total de secretarias processadas e inseridas: {total_inserido}")


def main():
    db = get_db()
    cur = db.cursor()
    try:
        seed_secretarias(cur)
        db.commit()
        log.info("ETL de secretarias estaduais concluído com sucesso.")
    except Exception as e:
        db.rollback()
        log.error(f"Erro fatal no ETL de secretarias: {e}")
    finally:
        db.close()


if __name__ == '__main__':
    main()
