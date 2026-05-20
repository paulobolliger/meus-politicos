"""
Seed de governadores atuais (2023-2026) e tribunais estaduais.

Fontes dos dados:
  - Governadores: TSE resultados 2022 (já coletados via collect_eleitos_2022.py)
    + cruzamento manual com politicos.cargo = 'governador'
  - Tribunais: dados institucionais públicos (sites oficiais CNJ / CNM / CNMP)

Estratégia:
  1. Tenta fazer match governador com politicos.cargo='governador' AND uf=sigla
  2. Insere em estados_governos com is_atual=true
  3. Insere estrutura básica de tribunais (TCE, TJ, MP, DP)

Uso:
  python seed_governos_tribunais.py
"""

import logging
import os

import psycopg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

# Governadores 2023-2026 (eleições 2022)
# Fonte: TSE resultado eleição 2022 — dados públicos
GOVERNADORES_2023 = [
    ('AC', 'Gladson Cameli',         'PP',       '2023-01-01', '2026-12-31', None),
    ('AL', 'Paulo Dantas',           'MDB',      '2023-01-01', '2026-12-31', None),
    ('AM', 'Wilson Lima',            'UNIÃO',    '2023-01-01', '2026-12-31', None),
    ('AP', 'Clécio Luís',            'SOLIDARIEDADE','2023-01-01', '2026-12-31', None),
    ('BA', 'Jerônimo Rodrigues',     'PT',       '2023-01-01', '2026-12-31', None),
    ('CE', 'Elmano de Freitas',      'PT',       '2023-01-01', '2026-12-31', None),
    ('DF', 'Ibaneis Rocha',          'MDB',      '2023-01-01', '2026-12-31', None),
    ('ES', 'Renato Casagrande',      'PSB',      '2023-01-01', '2026-12-31', None),
    ('GO', 'Ronaldo Caiado',         'UNIÃO',    '2023-01-01', '2026-12-31', None),
    ('MA', 'Carlos Brandão',         'PSB',      '2023-01-01', '2026-12-31', None),
    ('MG', 'Romeu Zema',             'NOVO',     '2023-01-01', '2026-12-31', None),
    ('MS', 'Eduardo Riedel',         'PSDB',     '2023-01-01', '2026-12-31', None),
    ('MT', 'Mauro Mendes',           'UNIÃO',    '2023-01-01', '2026-12-31', None),
    ('PA', 'Helder Barbalho',        'MDB',      '2023-01-01', '2026-12-31', None),
    ('PB', 'João Azevêdo',           'PSB',      '2023-01-01', '2026-12-31', None),
    ('PE', 'Raquel Lyra',            'PSDB',     '2023-01-01', '2026-12-31', None),
    ('PI', 'Rafael Fonteles',        'PT',       '2023-01-01', '2026-12-31', None),
    ('PR', 'Ratinho Junior',         'PSD',      '2023-01-01', '2026-12-31', None),
    ('RJ', 'Cláudio Castro',         'PL',       '2023-01-01', '2026-12-31', None),
    ('RN', 'Fátima Bezerra',         'PT',       '2023-01-01', '2026-12-31', None),
    ('RO', 'Marcos Rocha',           'UNIÃO',    '2023-01-01', '2026-12-31', None),
    ('RR', 'Arthur Henrique',        'MDB',      '2023-01-01', '2026-12-31', None),
    ('RS', 'Eduardo Leite',          'PSDB',     '2023-01-01', '2026-12-31', None),
    ('SC', 'Jorginho Mello',         'PL',       '2023-01-01', '2026-12-31', None),
    ('SE', 'Fábio Mitidieri',        'PSD',      '2023-01-01', '2026-12-31', None),
    ('SP', 'Tarcísio de Freitas',    'REPUBLICANOS','2023-01-01', '2026-12-31', None),
    ('TO', 'Wanderlei Barbosa',      'REPUBLICANOS','2023-01-01', '2026-12-31', None),
]

# Tribunais básicos por estado
# Tipo: 'tj' | 'tce' | 'mp' | 'dp'
TRIBUNAIS_BASE = [
    # (tipo, nome_padrao, site_padrao_template)
    ('tj',  'Tribunal de Justiça do Estado de {nome}',      'https://www.tjXX.jus.br'),
    ('tce', 'Tribunal de Contas do Estado de {nome}',       'https://www.tce.XX.gov.br'),
    ('mp',  'Ministério Público do Estado de {nome}',       'https://www.mpXX.mp.br'),
    ('dp',  'Defensoria Pública do Estado de {nome}',       'https://www.dpXX.def.br'),
]

ESTADO_NOMES = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AM': 'Amazonas', 'AP': 'Amapá',
    'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
    'GO': 'Goiás', 'MA': 'Maranhão', 'MG': 'Minas Gerais', 'MS': 'Mato Grosso do Sul',
    'MT': 'Mato Grosso', 'PA': 'Pará', 'PB': 'Paraíba', 'PE': 'Pernambuco',
    'PI': 'Piauí', 'PR': 'Paraná', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RO': 'Rondônia', 'RR': 'Roraima', 'RS': 'Rio Grande do Sul', 'SC': 'Santa Catarina',
    'SE': 'Sergipe', 'SP': 'São Paulo', 'TO': 'Tocantins',
}


def get_db():
    return psycopg.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        user=os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='prefer',
    )


def seed_governos(cur):
    log.info('Inserindo governadores 2023-2026...')
    ok = 0
    for (sigla, nome, partido, inicio, fim, foto) in GOVERNADORES_2023:
        # Tenta encontrar politico_id pelo cargo e uf
        cur.execute(
            '''SELECT id FROM politicos
               WHERE cargo = 'governador' AND uf = %s AND removido_em IS NULL
               ORDER BY mandato_inicio DESC NULLS LAST LIMIT 1''',
            (sigla,),
        )
        row = cur.fetchone()
        politico_id = row[0] if row else None

        cur.execute(
            '''
            INSERT INTO estados_governos
              (sigla, nome_governador, partido_sigla, politico_id, mandato_inicio, mandato_fim, is_atual, foto_url)
            VALUES (%s, %s, %s, %s, %s, %s, true, %s)
            ON CONFLICT DO NOTHING
            ''',
            (sigla, nome, partido, politico_id, inicio, fim, foto),
        )
        ok += 1
    log.info('Governadores inseridos: %d', ok)


def seed_tribunais(cur):
    log.info('Inserindo estrutura básica de tribunais...')
    ok = 0
    for sigla, nome_estado in ESTADO_NOMES.items():
        for tipo, nome_template, _ in TRIBUNAIS_BASE:
            nome_completo = nome_template.format(nome=nome_estado)
            cur.execute(
                '''
                INSERT INTO estados_tribunais (sigla, tipo, nome_completo)
                VALUES (%s, %s, %s)
                ON CONFLICT (sigla, tipo) DO NOTHING
                ''',
                (sigla, tipo, nome_completo),
            )
            ok += 1
    log.info('Estruturas de tribunais inseridas: %d', ok)


def main():
    db = get_db()
    cur = db.cursor()

    seed_governos(cur)
    seed_tribunais(cur)

    db.commit()
    db.close()
    log.info('Seed concluído.')


if __name__ == '__main__':
    main()
