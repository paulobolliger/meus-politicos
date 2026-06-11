-- Glossário v2 — 14 termos novos
-- Rodar: psql "host=localhost port=5433 dbname=meuspoliticos_db user=postgres password=..." -f seed_glossario_v2.sql

INSERT INTO glossario (slug, termo, definicao_simples, definicao_tecnica, categoria, exemplo, termos_relacionados)
VALUES

-- ── Ciclo Orçamentário ─────────────────────────────────────────────────────

(
  'ppa',
  'PPA (Plano Plurianual)',
  'É o plano de governo para quatro anos. Define as grandes metas e prioridades do que o governo quer realizar — como construir estradas, ampliar escolas ou reduzir a pobreza — e quanto dinheiro prevê gastar com isso.',
  'Instrumento constitucional de planejamento de médio prazo previsto no art. 165 da CF/88. Vigora por quatro anos (do segundo ano de um mandato ao primeiro ano do mandato seguinte) e estabelece as diretrizes, objetivos e metas da Administração Pública federal para as despesas de capital e os programas de duração continuada. Deve ser compatível com as leis de responsabilidade fiscal.',
  'financeiro',
  'O PPA 2024–2027 definiu programas como "Minha Casa Minha Vida" e metas de redução da pobreza extrema, orientando todas as leis orçamentárias do período.',
  ARRAY['ldo', 'loa', 'emenda-parlamentar']
),

(
  'ldo',
  'LDO (Lei de Diretrizes Orçamentárias)',
  'É a "ponte" entre o planejamento de longo prazo (PPA) e o orçamento do ano seguinte (LOA). Aprovada todo ano pelo Congresso, ela define as regras do jogo: quanto o governo pode gastar, quais são as prioridades e como as emendas parlamentares serão distribuídas.',
  'Prevista no art. 165, II da CF/88, a LDO é elaborada anualmente pelo Executivo e encaminhada ao Congresso até 15 de abril. Orienta a elaboração da LOA, dispõe sobre alterações na legislação tributária, estabelece a política de aplicação dos fundos de fomento e fixa critérios e parâmetros para as transferências aos entes federados.',
  'financeiro',
  'A LDO de 2025 fixou a meta fiscal de déficit zero e estabeleceu os tetos de emendas parlamentares individuais, de bancada e de comissão para o orçamento daquele ano.',
  ARRAY['ppa', 'loa', 'emenda-parlamentar', 'emenda-impositiva']
),

(
  'loa',
  'LOA (Lei Orçamentária Anual)',
  'É o orçamento do governo para o ano: estima quanto dinheiro vai entrar (impostos, taxas etc.) e define exatamente quanto e onde vai ser gasto. Cada emenda parlamentar aparece nessa lei como uma autorização de gasto.',
  'Instrumento constitucional previsto no art. 165, III da CF/88. Encaminhada pelo Executivo ao Congresso até 31 de agosto, deve ser votada até o encerramento do ano legislativo. Compreende o orçamento fiscal, o orçamento da seguridade social e o orçamento de investimento das estatais. As dotações das emendas parlamentares são registradas na LOA após aprovação pelo Congresso.',
  'financeiro',
  'Na LOA 2025, cada deputado federal pôde indicar até R$ 34 milhões em emendas individuais. O montante total de emendas aprovadas ultrapassou R$ 50 bilhões.',
  ARRAY['ppa', 'ldo', 'emenda-parlamentar', 'emenda-impositiva', 'siafi']
),

(
  'emenda-de-relator-rp9',
  'Emenda de Relator (RP9)',
  'Era um tipo de emenda ao orçamento feita pelo deputado ou senador escolhido como relator da lei orçamentária. Por concentrar enorme poder em uma única pessoa sem transparência sobre quem realmente se beneficiava, foi declarada inconstitucional pelo STF em 2022 — ficou conhecida como "orçamento secreto".',
  'As emendas de relator eram registradas sob o identificador RP9 (resultado primário) no SIAFI. Permitiam ao relator-geral da LOA remanejar bilhões de reais sem a rastreabilidade exigida das emendas individuais. O STF, no julgamento da ADI 7001, declarou a prática inconstitucional por violar os princípios da transparência orçamentária e do processo legislativo.',
  'financeiro',
  'Em 2021, o relator da LOA distribuiu cerca de R$ 16 bilhões em emendas RP9 sem que os beneficiários fossem publicamente identificados — o que gerou a CPI do Orçamento Secreto.',
  ARRAY['loa', 'emenda-parlamentar', 'emenda-impositiva', 'siafi', 'portal-da-transparencia']
),

-- ── Estrutura e Operação do Legislativo ───────────────────────────────────

(
  'mesa-diretora',
  'Mesa Diretora',
  'É o grupo de parlamentares eleitos pelos próprios colegas para presidir e organizar os trabalhos da Casa Legislativa. Na Câmara, é composta pelo Presidente, dois Vice-Presidentes e quatro Secretários. Quem preside a Mesa conduz as votações no plenário.',
  'Órgão diretivo das Casas Legislativas, previsto no Regimento Interno da Câmara dos Deputados (art. 14) e do Senado Federal (art. 46). Tem competência para administrar os serviços da Casa, interpretar o Regimento em casos omissos, conceder licenças a parlamentares e declarar a vacância de mandato. O presidente da Câmara é o segundo na linha de sucessão presidencial.',
  'legislativo',
  'Quando o Presidente e o Vice-Presidente da República estão simultaneamente impedidos, é o Presidente da Câmara dos Deputados — chefe da Mesa Diretora — quem assume o cargo interinamente.',
  ARRAY['plenario', 'quorum', 'sessao-ordinaria', 'colegio-de-lideres']
),

(
  'colegio-de-lideres',
  'Colégio de Líderes',
  'É a reunião dos líderes de cada partido e bloco parlamentar. Funciona como uma "cúpula" do Legislativo: aqui se decide a ordem das votações, se negocia o apoio ou a rejeição de projetos e se organiza a pauta da semana.',
  'Órgão consultivo previsto no Regimento Interno da Câmara (art. 20) e do Senado. Composto pelos líderes de todos os partidos e blocos com representação na Casa. Tem competência para deliberar sobre a elaboração da pauta de votações e a organização dos trabalhos legislativos. Suas decisões orientam fortemente a atuação da Mesa Diretora, embora não tenham caráter vinculante.',
  'legislativo',
  'Antes de uma votação polêmica, o Presidente da Câmara reuniu o Colégio de Líderes para avaliar se havia quórum suficiente e negociar o apoio de partidos indecisos.',
  ARRAY['plenario', 'bloco-parlamentar', 'obstrucao', 'quorum', 'mesa-diretora']
),

(
  'bloco-parlamentar',
  'Bloco Parlamentar',
  'É uma aliança formal entre dois ou mais partidos dentro do Legislativo. Funciona como um "time" maior: os partidos que se unem num bloco somam suas bancadas para ter mais representantes em comissões, mais tempo de fala e mais força nas negociações.',
  'Previstos nos regimentos internos da Câmara (art. 12) e do Senado, os blocos parlamentares são constituídos mediante registro na Mesa Diretora. Permitem que partidos com bancadas menores conquistem representação proporcional em comissões e no Colégio de Líderes. Diferentemente das federações partidárias (eleitorais), os blocos se formam e se dissolvem durante a legislatura, sem implicações eleitorais.',
  'legislativo',
  'Três partidos com 20, 15 e 10 deputados formaram um bloco parlamentar de 45 membros, garantindo vagas em todas as comissões temáticas da Câmara e assento no Colégio de Líderes.',
  ARRAY['federacao-partidaria', 'coligacao', 'colegio-de-lideres', 'comissao']
),

(
  'cpi',
  'CPI (Comissão Parlamentar de Inquérito)',
  'É uma comissão temporária criada pelo Congresso para investigar um fato grave de interesse público — como desvio de dinheiro, escândalos ou irregularidades em órgãos públicos. A CPI pode convocar ministros, quebrar sigilos bancários e ouvir testemunhas, quase como um tribunal.',
  'Prevista no art. 58, §3º da CF/88, a CPI é criada pela Câmara, pelo Senado ou pelo Congresso Nacional mediante requerimento de pelo menos um terço dos membros da Casa. Tem poderes investigativos equiparados aos das autoridades judiciais: pode determinar diligências, requisitar documentos, ouvir indiciados e testemunhas, e determinar quebras de sigilo bancário, fiscal e telefônico. Ao final, encaminha suas conclusões ao Ministério Público.',
  'legislativo',
  'A CPI da Pandemia (2021) investigou as ações do governo federal durante a Covid-19, ouviu mais de 60 depoentes ao longo de meses e concluiu com pedidos de indiciamento encaminhados ao Ministério Público Federal.',
  ARRAY['comissao', 'crime-de-responsabilidade', 'cassacao', 'plenario']
),

(
  'relatoria',
  'Relatoria',
  'É a função de um parlamentar designado para estudar um projeto de lei e dar um parecer — favorável ou contrário — antes que ele seja votado. O relator pode sugerir alterações ao texto original. Seu parecer influencia muito o resultado da votação.',
  'Função prevista nos regimentos internos das Casas Legislativas. O relator é designado pelo presidente da comissão ou da Casa para cada proposição em tramitação. Após análise do mérito, elabora parecer escrito com recomendação de aprovação, rejeição ou aprovação com emendas (substitutivo). Na LOA, o relator-geral tem poder adicional de remanejar dotações orçamentárias entre órgãos e programas.',
  'legislativo',
  'Um deputado foi designado relator de um PL sobre reforma tributária. Após audiências públicas com especialistas, apresentou um substitutivo com 40 alterações ao texto original antes da votação em plenário.',
  ARRAY['comissao', 'projeto-de-lei', 'proposta-de-emenda-a-constituicao', 'emenda-de-relator-rp9', 'destaque']
),

-- ── Dinâmica Eleitoral e Partidária ───────────────────────────────────────

(
  'quociente-eleitoral',
  'Quociente Eleitoral',
  'É o número mínimo de votos que um partido precisa atingir para conquistar uma vaga no Legislativo. Calculado dividindo o total de votos válidos pelo número de vagas disponíveis, ele funciona como uma "barreira de entrada": se o partido não chegar a esse número, não leva nenhuma cadeira.',
  'Mecanismo do sistema proporcional de lista aberta, previsto no art. 106 do Código Eleitoral (Lei nº 4.737/1965). O Quociente Eleitoral (QE) é obtido dividindo-se o total de votos válidos (excluídos brancos e nulos) pelo número de vagas a preencher. O número de cadeiras de cada partido é determinado pelo Quociente Partidário (QP = votos do partido ÷ QE). As vagas restantes são distribuídas pela maior média.',
  'eleitoral',
  'Em uma eleição com 100.000 votos válidos e 10 vagas, o QE é 10.000. Um partido com 28.000 votos obtém 2 vagas diretas (28.000 ÷ 10.000 = 2,8). Um partido com 9.000 votos fica sem nenhuma vaga direta.',
  ARRAY['eleicao-proporcional', 'clausula-de-barreira', 'federacao-partidaria', 'coligacao']
),

(
  'transfugismo-partidario',
  'Transfugismo Partidário',
  'Ocorre quando um político eleito troca de partido fora dos períodos e condições permitidos por lei. Dependendo da situação, pode configurar infidelidade partidária e resultar na perda do mandato, que retorna ao partido original.',
  'O TSE consolidou jurisprudência (Res. TSE nº 22.610/2007) reconhecendo o mandato eletivo proporcional como pertencente ao partido, não ao parlamentar individualmente. A troca de partido fora da janela partidária ou sem justa causa reconhecida pelo TSE pode implicar perda do mandato. São hipóteses de justa causa: criação de novo partido, fusão ou incorporação, mudança substancial de programa partidário.',
  'eleitoral',
  'Um deputado eleito pelo Partido A migrou para o Partido B fora do período da janela partidária. O Partido A ingressou com ação no TSE e o parlamentar perdeu o mandato, que foi assumido pelo suplente da lista original.',
  ARRAY['janela-partidaria', 'mandato', 'suplente', 'cassacao', 'federacao-partidaria']
),

(
  'vacancia',
  'Vacância',
  'É quando uma vaga num cargo eletivo fica definitivamente aberta — por morte, renúncia, cassação ou perda de mandato do titular. Dependendo do cargo e do tempo restante de mandato, a vaga pode ser ocupada pelo suplente ou gerar uma nova eleição.',
  'Situação jurídica prevista na CF/88 (arts. 56 e 83) e na legislação eleitoral. Para cargos proporcionais (deputados), a vaga é preenchida pelo suplente. Para cargos majoritários (presidente, governador), a CF prevê eleição indireta pelo Congresso ou Assembleia se a vacância ocorrer nos últimos dois anos do mandato; eleição direta se nos dois primeiros. Para senadores, o suplente assume diretamente.',
  'eleitoral',
  'Com a nomeação de um deputado federal para um cargo no Executivo, declarou-se a vacância de sua vaga na Câmara. O suplente seguinte da lista do partido foi convocado para assumir o mandato.',
  ARRAY['suplente', 'mandato', 'cassacao', 'recall', 'impugnacao-de-mandato']
),

-- ── Termos Políticos ──────────────────────────────────────────────────────

(
  'centrao',
  'Centrão',
  'É como a mídia e a política chamam informalmente um grupo de partidos do centro ao centro-direita que costumam apoiar o governo que estiver no poder — independentemente da ideologia — em troca de ministérios, cargos públicos e emendas parlamentares. Não é um bloco formal, mas sua influência no Congresso é enorme.',
  'Expressão de uso corrente na ciência política brasileira para designar um conjunto instável de partidos de médio porte com alta plasticidade ideológica e comportamento predominantemente fisiológico. São caracterizados pela disposição a compor com qualquer governo em troca de poder executivo e recursos orçamentários. A expressão surgiu na Assembleia Constituinte de 1987-88 para descrever a ala conservadora que se opunha ao bloco progressista.',
  'institucional',
  'Ao montar seu governo, o presidente eleito negociou com o Centrão a distribuição de pastas ministeriais em troca do apoio na aprovação de reformas constitucionais que exigiam quórum qualificado na Câmara.',
  ARRAY['emenda-parlamentar', 'bloco-parlamentar', 'fundo-partidario', 'lideranca-de-governo-oposicao']
),

(
  'lideranca-de-governo-oposicao',
  'Liderança de Governo / Oposição',
  'São parlamentares escolhidos para falar oficialmente em nome do governo ou da oposição nas discussões no plenário. O líder do governo articula votos a favor das propostas do Executivo; o líder da oposição coordena a resistência e apresenta alternativas.',
  'Cargos previstos nos regimentos internos da Câmara (arts. 10-11) e do Senado. O Líder do Governo é indicado pelo Presidente da República e tem prerrogativas regimentais especiais: pode requerer urgência para projetos do Executivo, usar a palavra após qualquer orador e pedir verificação de votação. O Líder da Oposição é eleito pelos partidos declaradamente de oposição e tem direitos simétricos. Ambos integram o Colégio de Líderes.',
  'legislativo',
  'Durante a votação de uma reforma previdenciária, o líder do governo orientou voto SIM a todos os deputados aliados, enquanto o líder da oposição orientou o voto NAO e pediu verificação de quórum para adiar a sessão.',
  ARRAY['colegio-de-lideres', 'plenario', 'obstrucao', 'votacao-nominal', 'bloco-parlamentar']
)
ON CONFLICT (slug) DO NOTHING;
