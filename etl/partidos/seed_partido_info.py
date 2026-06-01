"""
Adiciona colunas de informação institucional à tabela partidos
e popula os dados principais.

Colunas adicionadas:
  - presidente       (nome do presidente nacional)
  - fundado_em       (ano de fundação)
  - endereco         (endereço da sede)
  - cep              (CEP da sede)
  - telefone         (telefone de contato)
  - email            (e-mail de contato)
  - espectro         (posição ideológica: esquerda / centro-esquerda / centro / centro-direita / direita)
"""

import os
import sys
import psycopg
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(
    os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local')
)

DSN = (
    f"host={os.getenv('POSTGRES_HOST','localhost')} "
    f"port={os.getenv('POSTGRES_PORT','5433')} "
    f"dbname={os.getenv('POSTGRES_DB','meuspoliticos_db')} "
    f"user={os.getenv('POSTGRES_USER','postgres')} "
    f"password={os.getenv('POSTGRES_PASSWORD','')}"
)

# ---------------------------------------------------------------------------
# Dados por sigla
# ---------------------------------------------------------------------------
DADOS: list[dict] = [
    dict(sigla='PT',    presidente='Gleisi Hoffmann',     fundado_em=1980, espectro='esquerda',
         endereco='SQSW 302, Bloco A, Ed. Birmann 11, Asa Sul', cep='70673-100',
         telefone='(61) 3034-6200', email='pt@pt.org.br'),

    dict(sigla='PL',    presidente='Valdemar Costa Neto', fundado_em=2003, espectro='direita',
         endereco='SDS, Ed. Boulevard Center, Sala 500, Asa Sul', cep='70393-900',
         telefone='(61) 3225-6500', email='contato@pl.org.br'),

    dict(sigla='UNIAO', presidente='Antonio de Rueda',    fundado_em=2021, espectro='direita',
         endereco='SHCES Quadra 1206, Bloco E, Cruzeiro', cep='71530-126',
         telefone='(61) 3217-0800', email='contato@uniaobrasileira.org.br'),

    dict(sigla='PP',    presidente='Claudio Cajado',      fundado_em=1995, espectro='centro-direita',
         endereco='SRTVS Quadra 701, Bloco O, sala 1.001, Asa Sul', cep='70340-000',
         telefone='(61) 3217-9800', email='pp@pp.org.br'),

    dict(sigla='PSD',   presidente='Gilberto Kassab',     fundado_em=2011, espectro='centro',
         endereco='SCN Quadra 2 Bloco D, Ed. Liberty Mall, sala 1.102', cep='70712-903',
         telefone='(61) 3327-2244', email='contato@psd.org.br'),

    dict(sigla='MDB',   presidente='Baleia Rossi',        fundado_em=1966, espectro='centro',
         endereco='SHCS CR 504, Bloco C, Loja 19, Cruzeiro', cep='70350-500',
         telefone='(61) 3321-0600', email='mdb@mdb.org.br'),

    dict(sigla='REPUBLICANOS', presidente='Marcos Pereira', fundado_em=2005, espectro='centro-direita',
         endereco='SGAS Quadra 901, Conj. F, Ed. Cetenco, sala 256', cep='70390-010',
         telefone='(61) 3424-1700', email='contato@republicanos.org.br'),

    dict(sigla='PDT',   presidente='Carlos Lupi',         fundado_em=1980, espectro='centro-esquerda',
         endereco='SCS Quadra 7 Bloco A, Ed. Executive Tower, sala 711', cep='70307-901',
         telefone='(61) 3321-0600', email='pdt@pdt.org.br'),

    dict(sigla='PSDB',  presidente='Marconi Perillo',     fundado_em=1988, espectro='centro',
         endereco='SGAN Quadra 602, Conj. B, Parte A, Asa Norte', cep='70830-020',
         telefone='(61) 3329-2800', email='psdb@psdb.org.br'),

    dict(sigla='PSB',   presidente='Carlos Siqueira',     fundado_em=1947, espectro='centro-esquerda',
         endereco='SHCES Quadra 1206, Bloco E, Cruzeiro', cep='71530-126',
         telefone='(61) 3039-5800', email='psb@psb8.org.br'),

    dict(sigla='PODE',  presidente='Renata Abreu',        fundado_em=2013, espectro='centro',
         endereco='SRTVS Quadra 701, Bloco B, sala 570', cep='70340-000',
         telefone='(61) 3217-9200', email='contato@podemos.org.br'),

    dict(sigla='NOVO',  presidente='Eduardo Ribeiro',     fundado_em=2011, espectro='direita',
         endereco='SCS Quadra 9 Bloco C, Ed. Parque Cidade Corporate, Torre A', cep='70308-200',
         telefone='(61) 3550-1460', email='contato@novo.org.br'),

    dict(sigla='PSOL',  presidente='Glauber Braga',       fundado_em=2004, espectro='esquerda',
         endereco='SCLRN 716, Bloco H, Asa Norte', cep='70760-681',
         telefone='(61) 3340-1490', email='psol@psol50.org.br'),

    dict(sigla='PCdoB', presidente='Luciana Santos',      fundado_em=1922, espectro='esquerda',
         endereco='Rua Rego Freitas, 192, 4 andar, Vila Buarque, SP', cep='01220-010',
         telefone='(11) 3159-4141', email='pcdob@pcdob.org.br'),

    dict(sigla='AVANTE', presidente='Luis Tibe',          fundado_em=2017, espectro='centro',
         endereco='SCS Quadra 7, Bloco A, Ed. Executive Tower, sala 1.401', cep='70307-901',
         telefone='(61) 3033-7070', email='contato@avante70.org.br'),

    dict(sigla='SOLIDARIEDADE', presidente='Paulinho da Forca', fundado_em=2012, espectro='centro',
         endereco='SCS Quadra 6, Bloco A, Ed. Sofia, sala 901', cep='70300-915',
         telefone='(61) 3539-8200', email='solidariedade@solidariedade.org.br'),

    dict(sigla='CIDADANIA', presidente='Roberto Freire',  fundado_em=1985, espectro='centro-esquerda',
         endereco='SCS Quadra 1, Bloco M, Ed. Cetenco Brasilia, sala 401', cep='70308-900',
         telefone='(61) 3223-1416', email='cidadania@cidadania23.org.br'),

    dict(sigla='PRD',   presidente='Ciro Nogueira',       fundado_em=2023, espectro='centro-direita',
         endereco='SGAN Quadra 907, Modulo G, Asa Norte', cep='70790-075',
         telefone='(61) 3034-6200', email='contato@prd.org.br'),

    dict(sigla='PV',    presidente='Jose Luiz Penna',     fundado_em=1986, espectro='centro-esquerda',
         endereco='SCS Quadra 7, Bloco A, sala 504, Asa Sul', cep='70307-901',
         telefone='(61) 3226-5655', email='pv@pv.org.br'),

    dict(sigla='AGIR',  presidente='Daniel Tourinho',     fundado_em=2012, espectro='centro',
         endereco='SQSW 104, Bloco B, Ap. 202, Sudoeste', cep='70673-221',
         telefone='(61) 3226-8033', email='contato@agirpartido.org.br'),

    dict(sigla='DC',    presidente='Jose Maria Eymael',   fundado_em=1945, espectro='centro',
         endereco='SGAS Quadra 902, Bloco K, sala 108', cep='70390-120',
         telefone='(61) 3223-1965', email='dc@dc.org.br'),

    dict(sigla='PRTB',  presidente='Leonardo Avalanche',  fundado_em=1994, espectro='direita',
         endereco='SCS Quadra 5, Bloco B, sala 1.202', cep='70316-100',
         telefone='(61) 3226-6566', email='prtb@prtb.org.br'),

    dict(sigla='PMN',   presidente='Telma Ribeiro',       fundado_em=1984, espectro='centro-esquerda',
         endereco='SCS Quadra 2, Bloco C, sala 304', cep='70317-900',
         telefone='(61) 3224-3030', email='pmn@pmn.org.br'),

    dict(sigla='UP',    presidente='Leonardo Pellegrini',  fundado_em=2019, espectro='esquerda',
         endereco='Rua Conselheiro Nébias, 1052, Campos Eliseos, SP', cep='01203-002',
         telefone='(11) 3667-1250', email='contato@unidadepopular.org.br'),

    dict(sigla='REDE',  presidente='Marina Silva',        fundado_em=2013, espectro='centro-esquerda',
         endereco='SCLN 202, Bloco A, sala 101, Asa Norte', cep='70832-520',
         telefone='(61) 3323-2468', email='contato@redereconstrucaonacional.org.br'),

    dict(sigla='PATRIOTA', presidente='Ovasco Resende',   fundado_em=2012, espectro='centro-direita',
         endereco='SCS Quadra 1, Bloco E, sala 903', cep='70308-900',
         telefone='(61) 3226-3666', email='patriota@patriota51.org.br'),
]

# ---------------------------------------------------------------------------


def main() -> None:
    print("Conectando ao banco...")
    with psycopg.connect(DSN) as conn:
        with conn.cursor() as cur:

            # 1. Criar colunas se nao existirem
            print("Adicionando colunas...")
            for col, dtype in [
                ('presidente',  'text'),
                ('fundado_em',  'integer'),
                ('endereco',    'text'),
                ('cep',         'text'),
                ('telefone',    'text'),
                ('email',       'text'),
                ('espectro',    'text'),
            ]:
                cur.execute(f"""
                    ALTER TABLE partidos
                    ADD COLUMN IF NOT EXISTS {col} {dtype}
                """)

            conn.commit()
            print("Colunas OK.")

            # 2. Atualizar dados
            ok = 0
            miss = []
            for d in DADOS:
                cur.execute(
                    """
                    UPDATE partidos
                    SET
                      presidente = %(presidente)s,
                      fundado_em = %(fundado_em)s,
                      endereco   = %(endereco)s,
                      cep        = %(cep)s,
                      telefone   = %(telefone)s,
                      email      = %(email)s,
                      espectro   = %(espectro)s
                    WHERE UPPER(sigla) = UPPER(%(sigla)s)
                    """,
                    d
                )
                if cur.rowcount:
                    ok += 1
                else:
                    miss.append(d['sigla'])

            conn.commit()
            print(f"Atualizados: {ok} partidos.")
            if miss:
                print(f"NAO ENCONTRADOS: {miss}")


if __name__ == '__main__':
    main()
