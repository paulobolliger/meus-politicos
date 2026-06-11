"""
Seed de Linha do Tempo para todos os 27 Estados.
Insere eventos históricos importantes e as eleições de 2022 para cada estado.

Uso:
  python etl/estados/seed_timeline.py
"""

import logging
import os
import psycopg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

TIMELINE_EVENTS = [
    # AC - Acre
    ('AC', 1903, 11, 'Tratado de Petrópolis', 'Assinatura do tratado em que o Brasil adquire o território do Acre da Bolívia após a Revolução Acreana liderada por Plácido de Castro.', 'obra', 'positivo'),
    ('AC', 1962, 6, 'Elevação a Estado', 'O Acre é oficialmente elevado da categoria de território federal para Estado da Federação, sob a lei assinada por João Goulart.', 'reforma', 'positivo'),
    ('AC', 2022, 10, 'Eleição de Gladson Cameli', 'Gladson Cameli (PP) vence a disputa eleitoral no primeiro turno e é reeleito governador do Estado do Acre com 56,75% dos votos.', 'eleicao', 'neutro'),

    # AL - Alagoas
    ('AL', 1817, 9, 'Emancipação de Alagoas', 'Alagoas desmembra-se da Capitania de Pernambuco, tornando-se uma capitania independente por decreto de Dom João VI.', 'reforma', 'positivo'),
    ('AL', 2022, 10, 'Eleição de Paulo Dantas', 'Paulo Dantas (MDB) é eleito no segundo turno governador de Alagoas com 52,33% dos votos válidos.', 'eleicao', 'neutro'),

    # AM - Amazonas
    ('AM', 1850, 9, 'Criação da Província do Amazonas', 'Dom Pedro II assina a lei que eleva a Comarca do Alto Amazonas à categoria de Província independente, desmembrando-a do Grão-Pará.', 'reforma', 'positivo'),
    ('AM', 1967, 2, 'Criação da Zona Franca de Manaus', 'O governo federal edita o Decreto-Lei nº 288, ampliando os incentivos fiscais e criando o modelo Zona Franca de Manaus para impulsionar o desenvolvimento regional.', 'obra', 'positivo'),
    ('AM', 2022, 10, 'Eleição de Wilson Lima', 'Wilson Lima (UNIÃO) é reeleito governador do Amazonas no segundo turno das eleições estaduais com 56,65% dos votos.', 'eleicao', 'neutro'),

    # AP - Amapá
    ('AP', 1943, 9, 'Território Federal do Amapá', 'Getúlio Vargas assina o decreto que cria o Território Federal do Amapá, desmembrando terras do estado do Pará durante a Segunda Guerra Mundial.', 'reforma', 'neutro'),
    ('AP', 1988, 10, 'Elevação a Estado', 'Com a promulgação da Constituição de 1988, o Amapá deixa de ser território e é oficialmente elevado a Estado da Federação.', 'reforma', 'positivo'),
    ('AP', 2022, 10, 'Eleição de Clécio Luís', 'Clécio Luís (Solidariedade) é eleito governador do Amapá no primeiro turno com 53,69% dos votos.', 'eleicao', 'neutro'),

    # BA - Bahia
    ('BA', 1823, 7, 'Independência da Bahia', 'Consolidação da independência na Bahia (2 de Julho) com a retirada definitiva das tropas portuguesas de Salvador.', 'crise', 'positivo'),
    ('BA', 2022, 10, 'Eleição de Jerônimo Rodrigues', 'Jerônimo Rodrigues (PT) é eleito governador da Bahia no segundo turno com 52,79% dos votos, sucedendo Rui Costa.', 'eleicao', 'neutro'),

    # CE - Ceará
    ('CE', 1884, 3, 'Libertação dos Escravizados no Ceará', 'O Ceará torna-se a primeira província brasileira a abolir a escravidão, quatro anos antes da Lei Áurea, ganhando o título de "Terra da Luz".', 'reforma', 'positivo'),
    ('CE', 2022, 10, 'Eleição de Elmano de Freitas', 'Elmano de Freitas (PT) é eleito governador do Ceará no primeiro turno com 54,02% dos votos.', 'eleicao', 'neutro'),

    # DF - Distrito Federal
    ('DF', 1960, 4, 'Inauguração de Brasília', 'Brasília é oficialmente inaugurada pelo presidente Juscelino Kubitschek, tornando-se a nova capital federal e centro político do país.', 'obra', 'positivo'),
    ('DF', 2022, 10, 'Eleição de Ibaneis Rocha', 'Ibaneis Rocha (MDB) é reeleito governador do Distrito Federal no primeiro turno com 50,30% dos votos.', 'eleicao', 'neutro'),

    # ES - Espírito Santo
    ('ES', 1535, 5, 'Chegada do Donatário', 'Vasco Fernandes Coutinho desembarca na prainha de Vila Velha, fundando a capitania do Espírito Santo.', 'reforma', 'neutro'),
    ('ES', 2022, 10, 'Eleição de Renato Casagrande', 'Renato Casagrande (PSB) é reeleito governador do Espírito Santo no segundo turno com 53,80% dos votos.', 'eleicao', 'neutro'),

    # GO - Goiás
    ('GO', 1937, 10, 'Inauguração de Goiânia', 'Goiânia é inaugurada oficialmente como nova capital de Goiás pelo governador Pedro Ludovico Teixeira, substituindo a antiga Vila Boa de Goiás.', 'obra', 'positivo'),
    ('GO', 1988, 10, 'Divisão do Estado', 'A porção norte de Goiás é desmembrada pela nova Constituição para a criação do estado do Tocantins.', 'reforma', 'neutro'),
    ('GO', 2022, 10, 'Eleição de Ronaldo Caiado', 'Ronaldo Caiado (UNIÃO) é reeleito governador de Goiás no primeiro turno com 51,81% dos votos.', 'eleicao', 'neutro'),

    # MA - Maranhão
    ('MA', 1612, 9, 'Fundação de São Luís', 'Fundação da cidade de São Luís pelos colonizadores franceses liderados por Daniel de La Touche, na tentativa de estabelecer a França Equinocial.', 'obra', 'positivo'),
    ('MA', 2022, 10, 'Eleição de Carlos Brandão', 'Carlos Brandão (PSB) é eleito governador do Maranhão no primeiro turno das eleições estaduais com 51,29% dos votos.', 'eleicao', 'neutro'),

    # MG - Minas Gerais
    ('MG', 1789, 4, 'Inconfidência Mineira', 'Descoberta do movimento revolucionário republicano que lutava contra a cobrança da Derrama e buscava a independência de Minas Gerais.', 'crise', 'neutro'),
    ('MG', 2022, 10, 'Eleição de Romeu Zema', 'Romeu Zema (NOVO) é reeleito governador de Minas Gerais no primeiro turno com 56,18% dos votos.', 'eleicao', 'neutro'),

    # MS - Mato Grosso do Sul
    ('MS', 1977, 10, 'Divisão do Mato Grosso', 'O presidente Ernesto Geisel assina a lei que cria o estado de Mato Grosso do Sul, dividindo o antigo estado de Mato Grosso em dois.', 'reforma', 'positivo'),
    ('MS', 2022, 10, 'Eleição de Eduardo Riedel', 'Eduardo Riedel (PSDB) vence a disputa para governador de Mato Grosso do Sul no segundo turno com 56,90% dos votos.', 'eleicao', 'neutro'),

    # MT - Mato Grosso
    ('MT', 1719, 4, 'Descoberta do Ouro e Fundação', 'Pascoal Moreira Cabral assina a fundação do arraial da Forquilha (Cuiabá), após a descoberta de lavras de ouro na região.', 'obra', 'positivo'),
    ('MT', 2022, 10, 'Eleição de Mauro Mendes', 'Mauro Mendes (UNIÃO) é reeleito governador de Mato Grosso no primeiro turno com 68,45% dos votos.', 'eleicao', 'neutro'),

    # PA - Pará
    ('PA', 1835, 1, 'Início da Cabanagem', 'Estoura em Belém a revolta popular da Cabanagem, uma das mais marcantes insurreições sociais da história do Brasil Império.', 'crise', 'negativo'),
    ('PA', 2022, 10, 'Eleição de Helder Barbalho', 'Helder Barbalho (MDB) é reeleito governador do Pará no primeiro turno com 70,41% dos votos válidos (a maior votação proporcional do país).', 'eleicao', 'neutro'),

    # PB - Paraíba
    ('PB', 1585, 8, 'Fundação de Nossa Senhora das Neves', 'Fundação de João Pessoa (originalmente chamada de Nossa Senhora das Neves), após acordos de paz com os povos indígenas locais.', 'obra', 'positivo'),
    ('PB', 2022, 10, 'Eleição de João Azevêdo', 'João Azevêdo (PSB) é reeleito governador da Paraíba no segundo turno com 52,51% dos votos.', 'eleicao', 'neutro'),

    # PE - Pernambuco
    ('PE', 1817, 3, 'Revolução Pernambucana', 'Eclode o movimento revolucionário separatista e republicano em Recife, que instalou um governo provisório por 75 dias.', 'crise', 'neutro'),
    ('PE', 2022, 10, 'Eleição de Raquel Lyra', 'Raquel Lyra (PSDB) é eleita governadora de Pernambuco no segundo turno com 58,70% dos votos, tornando-se a primeira mulher no cargo na história do estado.', 'eleicao', 'neutro'),

    # PI - Piauí
    ('PI', 1823, 3, 'Batalha do Jenipapo', 'Ocorre no Piauí um dos confrontos mais sangrentos da Guerra da Independência do Brasil, onde populares piauienses lutaram contra tropas portuguesas.', 'crise', 'positivo'),
    ('PI', 2022, 10, 'Eleição de Rafael Fonteles', 'Rafael Fonteles (PT) é eleito governador do Piauí no primeiro turno com 57,17% dos votos.', 'eleicao', 'neutro'),

    # PR - Paraná
    ('PR', 1853, 12, 'Emancipação Política do Paraná', 'O Paraná desmembra-se oficialmente da província de São Paulo, tornando-se uma província autônoma sob o comando do conselheiro Zacarias de Góes.', 'reforma', 'positivo'),
    ('PR', 2022, 10, 'Eleição de Ratinho Junior', 'Ratinho Junior (PSD) é reeleito governador do Paraná no primeiro turno das eleições com 69,64% dos votos.', 'eleicao', 'neutro'),

    # RJ - Rio de Janeiro
    ('RJ', 1975, 3, 'Fusão Guanabara-Rio de Janeiro', 'Entra em vigor a lei complementar federal que promoveu a fusão dos antigos estados do Rio de Janeiro e da Guanabara, estabelecendo o Rio como capital do estado.', 'reforma', 'positivo'),
    ('RJ', 2022, 10, 'Eleição de Cláudio Castro', 'Cláudio Castro (PL) é reeleito governador do Rio de Janeiro no primeiro turno das eleições estaduais com 58,67% dos votos.', 'eleicao', 'neutro'),

    # RN - Rio Grande do Norte
    ('RN', 1599, 12, 'Fundação da Cidade do Natal', 'Fundação oficial de Natal, sob o Forte dos Reis Magos, para consolidar a presença portuguesa e combater corsários franceses.', 'obra', 'positivo'),
    ('RN', 2022, 10, 'Eleição de Fátima Bezerra', 'Fátima Bezerra (PT) é reeleito governador do Rio Grande do Norte no primeiro turno com 58,31% dos votos válidos.', 'eleicao', 'neutro'),

    # RO - Rondônia
    ('RO', 1981, 12, 'Elevação a Estado de Rondônia', 'O presidente João Figueiredo assina a lei complementar que eleva o Território Federal de Rondônia à categoria de Estado.', 'reforma', 'positivo'),
    ('RO', 2022, 10, 'Eleição de Marcos Rocha', 'Marcos Rocha (UNIÃO) é reeleito governador de Rondônia no segundo turno das eleições com 52,47% dos votos.', 'eleicao', 'neutro'),

    # RR - Roraima
    ('RR', 1988, 10, 'Criação do Estado de Roraima', 'A nova Constituição Federal transforma o Território Federal de Roraima em Estado da Federação, marcando sua autonomia administrativa.', 'reforma', 'positivo'),
    ('RR', 2022, 10, 'Eleição de Antonio Denarium', 'Antonio Denarium (PP) é reeleito governador do Estado de Roraima no primeiro turno das eleições com 56,47% dos votos.', 'eleicao', 'neutro'),

    # RS - Rio Grande do Sul
    ('RS', 1835, 9, 'Início da Guerra dos Farrapos', 'Início da Revolução Farroupilha contra as políticas tarifárias do governo imperial, instituindo a República Rio-Grandense.', 'crise', 'neutro'),
    ('RS', 2022, 10, 'Eleição de Eduardo Leite', 'Eduardo Leite (PSDB) vence a eleição no segundo turno com 57,12% dos votos, tornando-se o primeiro governador reeleito consecutivamente na história do estado.', 'eleicao', 'neutro'),

    # SC - Santa Catarina
    ('SC', 1839, 7, 'República Juliana', 'Líderes revolucionários sob a influência da Revolução Farroupilha proclamam a República Juliana em Laguna, estendendo a guerra a Santa Catarina.', 'crise', 'neutro'),
    ('SC', 2022, 10, 'Eleição de Jorginho Mello', 'Jorginho Mello (PL) é eleito governador de Santa Catarina no segundo turno com 70,69% dos votos.', 'eleicao', 'neutro'),

    # SE - Sergipe
    ('SE', 1820, 7, 'Emancipação de Sergipe', 'Dom João VI decreta a emancipação política de Sergipe, separando sua capitania da jurisdição da Bahia.', 'reforma', 'positivo'),
    ('SE', 2022, 10, 'Eleição de Fábio Mitidieri', 'Fábio Mitidieri (PSD) é eleito governador de Sergipe no segundo turno com 51,70% dos votos válidos.', 'eleicao', 'neutro'),

    # SP - São Paulo
    ('SP', 1932, 7, 'Revolução Constitucionalista', 'Início da Revolução Constitucionalista de 1932, movimento armado em que São Paulo lutou contra o governo provisório de Getúlio Vargas.', 'crise', 'neutro'),
    ('SP', 2022, 10, 'Eleição de Tarcísio de Freitas', 'Tarcísio de Freitas (Republicanos) é eleito governador do Estado de São Paulo no segundo turno com 55,27% dos votos válidos.', 'eleicao', 'neutro'),

    # TO - Tocantins
    ('TO', 1988, 10, 'Criação do Estado do Tocantins', 'Com a promulgação da Constituição de 1988, o norte de Goiás é desmembrado e é oficialmente criado o Estado do Tocantins.', 'reforma', 'positivo'),
    ('TO', 2022, 10, 'Eleição de Wanderlei Barbosa', 'Wanderlei Barbosa (Republicanos) é reeleito governador do Tocantins no primeiro turno com 58,14% dos votos.', 'eleicao', 'neutro'),
]


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable',
    )


def seed_timeline(cur):
    log.info('Limpando registros antigos da timeline...')
    cur.execute('DELETE FROM estados_timeline')
    
    log.info('Inserindo novos marcos históricos e políticos...')
    ok = 0
    for (sigla, ano, mes, titulo, descricao, tipo, impacto) in TIMELINE_EVENTS:
        cur.execute(
            '''
            INSERT INTO estados_timeline (sigla, ano, mes, titulo, descricao, tipo, impacto)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''',
            (sigla, ano, mes, titulo, descricao, tipo, impacto),
        )
        ok += 1
    log.info('Marcos da timeline inseridos: %d', ok)


def main():
    db = get_db()
    cur = db.cursor()

    seed_timeline(cur)

    db.commit()
    db.close()
    log.info('Seed de timeline concluído com sucesso.')


if __name__ == '__main__':
    main()
