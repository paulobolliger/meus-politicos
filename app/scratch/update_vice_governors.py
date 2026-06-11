import os
import logging
import psycopg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

# List of actual vice-governors of all 27 states (2023-2026)
VICE_GOVERNADORES = {
    'AC': 'Mailza Assis',
    'AL': 'Ronaldo Lessa',
    'AM': 'Tadeu de Souza',
    'AP': 'Teles Júnior',
    'BA': 'Geraldo Júnior',
    'CE': 'Jade Romero',
    'DF': 'Celina Leão',
    'ES': 'Ricardo Ferraço',
    'GO': 'Daniel Vilela',
    'MA': 'Felipe Camarão',
    'MG': 'Mateus Simões',
    'MS': 'José Carlos Barbosa (Barbosinha)',
    'MT': 'Otaviano Pivetta',
    'PA': 'Hana Ghassan',
    'PB': 'Lucas Ribeiro',
    'PE': 'Priscila Krause',
    'PI': 'Themístocles Filho',
    'PR': 'Darci Piana',
    'RJ': 'Thiago Pampolha',
    'RN': 'Walter Alves',
    'RO': 'Sérgio Gonçalves',
    'RR': 'Edilson Damião',
    'RS': 'Gabriel Souza',
    'SC': 'Marilisa Boehm',
    'SE': 'Zezinho Sobral',
    'SP': 'Felício Ramuth',
    'TO': 'Laurez Moreira'
}

def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable',
    )

def main():
    db = get_db()
    cur = db.cursor()
    try:
        log.info("Atualizando vice-governadores no banco de dados...")
        updated = 0
        for sigla, nome_vice in VICE_GOVERNADORES.items():
            cur.execute(
                """
                UPDATE estados_governos 
                SET nome_vice = %s 
                WHERE sigla = %s AND is_atual = true
                """,
                (nome_vice, sigla)
            )
            updated += cur.rowcount
        db.commit()
        log.info(f"Sucesso! {updated} registros de vice-governadores foram atualizados.")
    except Exception as e:
        db.rollback()
        log.error(f"Erro ao atualizar vice-governadores: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    main()
