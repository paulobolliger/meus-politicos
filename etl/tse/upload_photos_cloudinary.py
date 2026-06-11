"""
Script para fazer o upload das fotos dos políticos do TSE para o Cloudinary
e atualizar as URLs no banco de dados.

Organização de pastas no Cloudinary:
  meus-politicos/politicos/dep-estadual
  meus-politicos/politicos/dep-federal
  meus-politicos/politicos/senador
  meus-politicos/politicos/executivo
  meus-politicos/politicos/outros

Uso:
  python etl/tse/upload_photos_cloudinary.py [--limite 10] [--cargo deputado_estadual]
"""

import argparse
import os
import logging
import time
import psycopg
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv(
    os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local')
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
log = logging.getLogger(__name__)

# Configurar Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

CARGO_FOLDER_MAP = {
    'deputado_federal': 'dep-federal',
    'senador': 'senador',
    'deputado_estadual': 'dep-estadual',
    'governador': 'executivo',
    'vice_governador': 'executivo',
    'presidente': 'executivo',
    'vice_presidente': 'executivo',
    'prefeito': 'executivo',
    'vice_prefeito': 'executivo',
    'vereador': 'vereador'
}


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST'),
        port=int(os.getenv('POSTGRES_PORT', '5432')),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB'),
        sslmode='disable'
    )


def transferir_fotos(limite: int = None, cargo_filtro: str = None):
    db = get_db()
    cur = db.cursor()

    # Selecionar políticos com fotos externas (TSE) que ainda não foram para o Cloudinary
    query = """
        SELECT id, slug, nome_eleitoral, cargo, uf, foto_url 
        FROM politicos 
        WHERE foto_url IS NOT NULL 
          AND foto_url != '' 
          AND foto_url NOT LIKE '%%cloudinary.com%%'
    """
    params = []
    if cargo_filtro:
        query += " AND cargo = %s"
        params.append(cargo_filtro)

    query += " ORDER BY nome_eleitoral"

    if limite:
        query += " LIMIT %s"
        params.append(limite)

    cur.execute(query, params)
    politicos = cur.fetchall()

    if not politicos:
        log.info("Nenhum político pendente de upload de foto encontrado.")
        cur.close()
        db.close()
        return

    log.info(f"Encontrados {len(politicos)} políticos para upload no Cloudinary.")

    sucesso = 0
    erros = 0

    for pol in politicos:
        pol_id, slug, nome_eleitoral, cargo, uf, foto_url = pol
        
        # Determinar a pasta de destino
        subpasta = CARGO_FOLDER_MAP.get(cargo, 'outros')
        folder_path = f"meus-politicos/politicos/{subpasta}"

        log.info(f"Enviando foto de {nome_eleitoral} ({cargo} - {uf}) de: {foto_url}")

        try:
            # Fazer upload direto passando a URL externa para o Cloudinary
            response = cloudinary.uploader.upload(
                foto_url,
                public_id=slug,
                folder=folder_path,
                tags=[nome_eleitoral, cargo, uf, "eleicoes_tse"],
                overwrite=True,
                resource_type="image"
            )

            cloudinary_url_secure = response.get("secure_url")

            if cloudinary_url_secure:
                # Atualizar o banco de dados
                cur.execute(
                    "UPDATE politicos SET foto_url = %s, atualizado_em = now() WHERE id = %s",
                    (cloudinary_url_secure, pol_id)
                )
                db.commit()
                sucesso += 1
                log.info(f"  -> Sucesso! Nova URL: {cloudinary_url_secure}")
            else:
                log.error(f"  -> Falhou: secure_url não retornada pelo Cloudinary")
                erros += 1

        except Exception as e:
            log.error(f"  -> Erro ao enviar para o Cloudinary: {e}")
            db.rollback()
            erros += 1

        # Pequeno delay para evitar overload da API
        time.sleep(0.3)

    cur.close()
    db.close()
    log.info(f"Processo concluído. Sucessos: {sucesso}, Erros: {erros}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--limite', type=int, default=None, help='Limite de políticos a processar')
    parser.add_argument('--cargo', type=str, default=None, help='Filtrar por cargo (ex: deputado_estadual)')
    args = parser.parse_args()

    transferir_fotos(limite=args.limite, cargo_filtro=args.cargo)
