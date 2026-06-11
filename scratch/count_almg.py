import psycopg
import os
from dotenv import load_dotenv

load_dotenv('app/.env.local')

conn = psycopg.connect(
    host=os.getenv('POSTGRES_HOST'),
    port=int(os.getenv('POSTGRES_PORT', '5432')),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD'),
    dbname=os.getenv('POSTGRES_DB')
)

with conn.cursor() as cur:
    cur.execute("SELECT COUNT(*)::int FROM gastos WHERE source_id = 'almg'")
    count = cur.fetchone()[0]
    print('Total ALMG gastos records in database:', count)

conn.close()
