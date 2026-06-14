'use server'

import OpenAI from 'openai'
import { getPgPool } from '@/lib/db/pool'

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

type ProjetoContext = {
  tipo: string
  numero: string | number
  ano: number
  ementa: string | null
  ementa_simples: string | null
  titulo_simplificado: string | null
  situacao: string | null
}

type PoliticoContext = {
  nome: string
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  partido_sigla: string | null
}

type EmendaContext = {
  codigo_emenda: string
  ano: number
  valor: number | null
  valor_pago: number | null
  municipio_nome: string | null
  uf_municipio: string | null
  funcao: string | null
  area: string | null
  tipo_emenda: string | null
  autor_nome: string | null
  partido_sigla: string | null
}

type VerbeteContext = {
  termo: string
  definicao_simples: string
  definicao_tecnica: string | null
  exemplo: string | null
  categoria: string | null
}

const SYSTEM_PROMPT = `Você é a "Inteligência Cívica" do portal Meus Políticos.
Seu objetivo é explicar projetos de lei de forma extremamente simples, neutra e didática para cidadãos leigos, sem jargões jurídicos ("sem juridiquês").
REGRAS:
1. Mantenha um tom apartidário, neutro, puramente informativo.
2. Não tome partido se o projeto é bom ou ruim; explique os impactos práticos (ex: se aumenta imposto, se cria benefício, quem é afetado).
3. Responda de forma concisa e em parágrafos curtos.
4. Se o usuário fizer perguntas fora do escopo do projeto de lei fornecido, explique polidamente que seu foco é tirar dúvidas sobre esta matéria legislativa específica.`

export async function perguntarIA(
  projetoId: string,
  historico: Message[],
  pergunta: string
): Promise<{ resposta: string } | { erro: string }> {
  if (!pergunta || pergunta.trim().length === 0) {
    return { erro: 'A pergunta não pode estar vazia.' }
  }

  try {
    const db = getPgPool()
    
    // Busca informações detalhadas do projeto no banco de dados para alimentar o contexto do prompt
    const { rows } = await db.query<ProjetoContext>(
      `SELECT tipo, numero, ano, ementa, ementa_simples, titulo_simplificado, situacao 
       FROM proposicoes 
       WHERE id = $1 LIMIT 1`,
      [projetoId]
    )

    const projeto = rows[0]
    if (!projeto) {
      return { erro: 'Projeto de lei não encontrado.' }
    }

    const context = `INFORMAÇÕES DO PROJETO DE LEI:
Tipo: ${projeto.tipo}
Número: ${projeto.numero}/${projeto.ano}
Título/Tema: ${projeto.titulo_simplificado ?? 'Não disponível'}
Ementa Oficial: ${projeto.ementa ?? 'Não disponível'}
Resumo Cidadão (IA): ${projeto.ementa_simples ?? 'Não disponível'}
Situação atual: ${projeto.situacao ?? 'Em tramitação'}`

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Fallback inteligente caso a chave OpenAI não esteja configurada
      return {
        resposta: obterRespostaLocal(projeto, pergunta),
      }
    }

    const client = new OpenAI({ apiKey })
    const messagesChat: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `CONTEXTO DO PROJETO LEGISLATIVO:\n${context}` },
      ...historico.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: pergunta },
    ]

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 400,
      messages: messagesChat,
    })

    const reply = response.choices[0]?.message?.content ?? ''
    if (!reply) {
      return { erro: 'Não foi possível gerar uma resposta. Tente novamente mais tarde.' }
    }

    return { resposta: reply }
  } catch (error: unknown) {
    console.error('[IA Pergunta Projeto Error]:', error)
    return { erro: 'Erro ao processar a pergunta da Inteligência Cívica.' }
  }
}

// Resposta determinística local baseada no projeto se a chave da API estiver indisponível
function obterRespostaLocal(projeto: ProjetoContext, pergunta: string): string {
  const query = pergunta.toLowerCase()
  const nomePL = `${projeto.tipo} ${projeto.numero}/${projeto.ano}`
  const tema = projeto.titulo_simplificado || 'esta matéria legislativa'

  if (query.includes('afeta') || query.includes('bolso') || query.includes('dinheiro') || query.includes('custar') || query.includes('custo')) {
    return `Sobre os impactos financeiros do **${nomePL}** (${tema}):
A ementa oficial aponta que o projeto trata de: *"${projeto.ementa || 'Sem descrição oficial'}"*. 

De forma prática, o projeto define regras regulatórias ou organizacionais. Para saber o impacto financeiro exato na sua região, é importante acompanhar as estimativas de impacto orçamentário que são anexadas durante a análise pelas comissões de Finanças e Tributação da respectiva Casa.`
  }

  if (query.includes('situacao') || query.includes('status') || query.includes('onde esta') || query.includes('tramitando')) {
    return `O **${nomePL}** está atualmente com o status: **"${projeto.situacao || 'Em tramitação'}"**. 
Isso significa que a matéria está seguindo os ritos das comissões técnicas oficiais ou aguarda votação em plenário. Você pode acompanhar a linha do tempo completa de andamento na seção de "Tramitação" nesta mesma página.`
  }

  if (query.includes('resumo') || query.includes('o que e') || query.includes('funciona') || query.includes('explica')) {
    return `Aqui está uma explicação simples sobre o **${nomePL}** (${tema}):
Este projeto visa regulamentar ou alterar normas vigentes sobre o assunto principal descrito na ementa.
- **O que propõe:** *"${projeto.ementa_simples || projeto.ementa || 'Proposta em tramitação legislativa'}"*.
- **Quem afeta:** Cidadãos e instituições relacionadas à área do tema regulado.
- **Situação:** Atualmente está classificado como *"${projeto.situacao || 'Em tramitação'}"*.`
  }

  return `Entendi sua dúvida sobre o **${nomePL}** (${tema}). 
Como a chave de acesso direto à API de Inteligência Artificial não está ativada no ambiente de testes local, aqui está o resumo do que dispomos oficialmente:
- **Assunto:** ${projeto.ementa || 'Não há detalhes adicionais cadastrados.'}
- **Situação da matéria:** ${projeto.situacao || 'Em tramitação'}

Se precisar de detalhes técnicos específicos ou pareceres de relatores, consulte os links na seção "Documentos Oficiais".`
}

export async function perguntarPoliticoIA(
  politicoId: string,
  historico: Message[],
  pergunta: string
): Promise<{ resposta: string } | { erro: string }> {
  if (!pergunta || pergunta.trim().length === 0) {
    return { erro: 'A pergunta não pode estar vazia.' }
  }

  try {
    const db = getPgPool()
    const { rows } = await db.query<PoliticoContext>(
      `SELECT p.nome, p.nome_eleitoral, p.cargo::text AS cargo, p.uf,
              p.presenca_pct_atual, p.gasto_total_ano, p.total_votacoes,
              pt.sigla AS partido_sigla
       FROM politicos p
       LEFT JOIN partidos pt ON pt.id = p.partido_id
       WHERE p.id = $1 LIMIT 1`,
      [politicoId]
    )

    const politico = rows[0]
    if (!politico) {
      return { erro: 'Político não encontrado.' }
    }

    const nome = politico.nome_eleitoral || politico.nome
    const cargo = politico.cargo === 'senador' ? 'Senador(a)' : 'Deputado(a) Federal'
    const context = `INFORMAÇÕES DE ATUAÇÃO PARLAMENTAR:
Nome: ${nome}
Cargo: ${cargo}
Partido/UF: ${politico.partido_sigla ?? 'Sem partido'} · ${politico.uf ?? '–'}
Taxa de Presença: ${politico.presenca_pct_atual != null ? `${Math.round(politico.presenca_pct_atual)}%` : 'Não informada'}
Gasto total acumulado no ano (CEAP): ${politico.gasto_total_ano != null ? `R$ ${Number(politico.gasto_total_ano).toLocaleString('pt-BR')}` : 'Não informado'}
Total de Votações Nominais registradas: ${politico.total_votacoes ?? 0}`

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return {
        resposta: obterRespostaPoliticoLocal(politico, pergunta),
      }
    }

    const client = new OpenAI({ apiKey })
    const systemPromptPolitico = `Você é a "Inteligência Cívica" do portal Meus Políticos.
Seu objetivo é explicar a atuação parlamentar, gastos e dados oficiais de presença de ${nome} em linguagem cidadã direta e simples.
REGRAS:
1. Mantenha um tom 100% neutro, sem juízo de valor.
2. Explique os números no contexto (ex: o teto máximo de gastos, se a presença é alta ou baixa, o que os gastos significam).
3. Seja breve e responda em parágrafos curtos.`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPromptPolitico },
        { role: 'system', content: `CONTEXTO DO PARLAMENTAR:\n${context}` },
        ...historico.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: pergunta },
      ],
    })

    const reply = response.choices[0]?.message?.content ?? ''
    if (!reply) {
      return { erro: 'Não foi possível gerar uma resposta. Tente novamente.' }
    }

    return { resposta: reply }
  } catch (error) {
    console.error('[IA Pergunta Politico Error]:', error)
    return { erro: 'Erro ao processar a pergunta sobre o político.' }
  }
}

function obterRespostaPoliticoLocal(politico: PoliticoContext, pergunta: string): string {
  const query = pergunta.toLowerCase()
  const nome = politico.nome_eleitoral || politico.nome
  const cargo = politico.cargo === 'senador' ? 'Senador(a)' : 'Deputado(a) Federal'

  if (query.includes('gasto') || query.includes('ceap') || query.includes('dinheiro') || query.includes('despesa')) {
    return `Sobre as despesas de gabinete de **${nome}**:
O parlamentar registrou um gasto total acumulado de **R$ ${
      politico.gasto_total_ano != null ? Number(politico.gasto_total_ano).toLocaleString('pt-BR') : '–'
    }** neste ano. 

Esses recursos pertencem à Cota para Exercício da Atividade Parlamentar (CEAP), usada para ressarcir despesas como passagens aéreas, combustível e manutenção de escritório político. Você pode ver o detalhamento por categoria na aba de "Gastos".`
  }

  if (query.includes('presenca') || query.includes('falta') || query.includes('sessao') || query.includes('plenario')) {
    return `Sobre a presença legislativa de **${nome}**:
O parlamentar possui uma taxa de presença de **${
      politico.presenca_pct_atual != null ? `${Math.round(politico.presenca_pct_atual)}%` : '–'
    }** nas sessões plenárias oficiais registradas. 

Isso reflete o comparecimento do parlamentar nas convocações de votação do plenário da Câmara ou Senado. As justificativas de faltas são registradas pelas respectivas comissões de corregedoria e mesa diretora.`
  }

  return `Aqui está um resumo da atuação de **${nome}** (${cargo} · ${politico.partido_sigla ?? 'Sem partido'}/${politico.uf ?? '–'}):
- **Presença em Sessões:** ${politico.presenca_pct_atual != null ? `${Math.round(politico.presenca_pct_atual)}%` : 'Dados indisponíveis'}
- **Gastos Totais Declarados:** ${politico.gasto_total_ano != null ? `R$ ${Number(politico.gasto_total_ano).toLocaleString('pt-BR')}` : 'Dados indisponíveis'}
- **Votações Registradas:** ${politico.total_votacoes ?? 0} votações nominais.

Para dúvidas mais específicas ou para ver como ele votou em projetos individuais, navegue pelas abas "Votações" e "Gastos" deste perfil.`
}

export async function perguntarEmendaIA(
  emendaId: string,
  historico: Message[],
  pergunta: string
): Promise<{ resposta: string } | { erro: string }> {
  if (!pergunta || pergunta.trim().length === 0) {
    return { erro: 'A pergunta não pode estar vazia.' }
  }

  try {
    const db = getPgPool()
    
    // Busca informações detalhadas da emenda no banco de dados para alimentar o contexto do prompt
    const { rows } = await db.query<EmendaContext>(
      `SELECT e.numero_emenda AS codigo_emenda, e.ano, e.valor, e.valor_pago,
              e.municipio_nome, e.uf_municipio, e.funcao, e.area, e.tipo_emenda,
              p.nome_eleitoral AS autor_nome, pt.sigla AS partido_sigla
       FROM emendas e
       LEFT JOIN politicos p ON p.id = e.politico_id
       LEFT JOIN partidos pt ON pt.id = p.partido_id
       WHERE e.id = $1 LIMIT 1`,
      [emendaId]
    )

    const emenda = rows[0]
    if (!emenda) {
      return { erro: 'Emenda não encontrada.' }
    }

    const context = `INFORMAÇÕES DA EMENDA PARLAMENTAR:
Código: ${emenda.codigo_emenda}
Ano: ${emenda.ano}
Tipo: ${emenda.tipo_emenda ?? 'Não especificado'}
Autor: ${emenda.autor_nome ?? 'Bancada / Coletivo'} (${emenda.partido_sigla ?? 'Sem partido'})
Valor Empenhado (Reservado): R$ ${Number(emenda.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Valor Pago: R$ ${Number(emenda.valor_pago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Cidade de Destino: ${emenda.municipio_nome ?? 'Não especificada'} - ${emenda.uf_municipio ?? '–'}
Função/Área: ${emenda.funcao ?? 'Não especificada'} / ${emenda.area ?? 'Não especificada'}`

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return {
        resposta: obterRespostaEmendaLocal(emenda, pergunta),
      }
    }

    const client = new OpenAI({ apiKey })
    const systemPromptEmenda = `Você é a "Inteligência Cívica" do portal Meus Políticos.
Seu objetivo é explicar como emendas parlamentares funcionam, como o orçamento público é executado e o que significa a destinação para esta emenda de forma simples e didática.
REGRAS:
1. Mantenha um tom apartidário, neutro, puramente informativo.
2. Explique os jargões orçamentários (ex: "Empenhado", "Pago", "Transferência Especial/Pix", "Finalidade Definida") em linguagem simples.
3. Não emita juízo de valor sobre o político ou sobre a destinação ser boa ou má; descreva apenas fatos e como funciona a fiscalização.
4. Responda de forma concisa e em parágrafos curtos.`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPromptEmenda },
        { role: 'system', content: `CONTEXTO DA EMENDA:\n${context}` },
        ...historico.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: pergunta },
      ],
    })

    const reply = response.choices[0]?.message?.content ?? ''
    if (!reply) {
      return { erro: 'Não foi possível gerar uma resposta. Tente novamente mais tarde.' }
    }

    return { resposta: reply }
  } catch (error: unknown) {
    console.error('[IA Pergunta Emenda Error]:', error)
    return { erro: 'Erro ao processar a pergunta sobre a emenda.' }
  }
}

function obterRespostaEmendaLocal(emenda: EmendaContext, pergunta: string): string {
  const query = pergunta.toLowerCase()
  const cod = emenda.codigo_emenda
  const cidade = emenda.municipio_nome || 'município'
  const autor = emenda.autor_nome || 'autor'
  const val = Number(emenda.valor_pago || emenda.valor || 0).toLocaleString('pt-BR')

  if (query.includes('pix') || query.includes('especial')) {
    return `Esta emenda **${cod}** do tipo *"${emenda.tipo_emenda || 'especial'}"* é conhecida popularmente como "emenda pix" se for uma Transferência Especial. 
Nas emendas pix, o dinheiro é depositado diretamente no caixa geral da prefeitura de **${cidade}** sem necessidade de convênio prévio ou projeto técnico complexo. A prefeitura tem liberdade para gastar em custeio e investimentos, exceto no pagamento de salários de servidores e juros de dívidas.`
  }

  if (query.includes('como fiscalizar') || query.includes('onde ver') || query.includes('fiscalizar') || query.includes('auditar')) {
    return `Para fiscalizar a emenda **${cod}** destinada para **${cidade}**:
1. **No Município**: Acesse o Portal da Transparência da Prefeitura de ${cidade} ou procure o Diário Oficial local para ver em qual contrato, licitação ou obra o valor de **R$ ${val}** foi alocado.
2. **No Tribunal de Contas**: Você pode acessar o site do Tribunal de Contas do Estado (TCE) correspondente ou do TCU para checar processos relacionados ao município.
3. **Conselhos Municipais**: Cidadãos podem cobrar informações nos conselhos municipais de Saúde, Educação ou Assistência Social, dependendo da área da emenda.`
  }

  return `Esta emenda parlamentar **${cod}** foi enviada por **${autor}** para **${cidade}**, com o valor pago de **R$ ${val}** na área de **${emenda.funcao || emenda.area || 'Desenvolvimento'}**. 

De forma local, recursos pagos já estão disponíveis para uso da prefeitura conforme a destinação definida no plano orçamentário. Você pode consultar o portal oficial de contratos do município para acompanhar o início das obras ou compra de equipamentos.`
}

export async function perguntarGlossarioIA(
  termoSlug: string,
  historico: Message[],
  pergunta: string
): Promise<{ resposta: string } | { erro: string }> {
  if (!pergunta || pergunta.trim().length === 0) {
    return { erro: 'A pergunta não pode estar vazia.' }
  }

  try {
    const db = getPgPool()
    const { rows } = await db.query<VerbeteContext>(
      `SELECT termo, definicao_simples, definicao_tecnica, exemplo, categoria 
       FROM glossario 
       WHERE slug = $1 LIMIT 1`,
      [termoSlug]
    )

    const verbete = rows[0]
    if (!verbete) {
      return { erro: 'Termo do glossário não encontrado.' }
    }

    const context = `INFORMAÇÕES DO TERMO POLÍTICO:
Termo: ${verbete.termo}
Categoria: ${verbete.categoria ?? 'Geral'}
Definição Simples: ${verbete.definicao_simples}
Definição Técnica: ${verbete.definicao_tecnica ?? 'Não disponível'}
Exemplo Prático: ${verbete.exemplo ?? 'Não disponível'}`

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return {
        resposta: obterRespostaGlossarioLocal(verbete, pergunta),
      }
    }

    const client = new OpenAI({ apiKey })
    const systemPromptGlossario = `Você é a "Inteligência Cívica" do portal Meus Políticos.
Seu objetivo é tirar dúvidas sobre o termo político "${verbete.termo}" de forma simples, didática e neutra para cidadãos leigos, sem "juridiquês".
REGRAS:
1. Mantenha um tom apartidário, neutro e informativo.
2. Explique em termos claros e dê exemplos cotidianos se necessário.
3. Responda de forma concisa e em parágrafos curtos.
4. Se a pergunta for totalmente fora do tema, explique polidamente que está focado em explicar o termo "${verbete.termo}".`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPromptGlossario },
        { role: 'system', content: `CONTEXTO DO VERBETE:\n${context}` },
        ...historico.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: pergunta },
      ],
    })

    const reply = response.choices[0]?.message?.content ?? ''
    if (!reply) {
      return { erro: 'Não foi possível gerar uma resposta. Tente novamente.' }
    }

    return { resposta: reply }
  } catch (error) {
    console.error('[IA Pergunta Glossario Error]:', error)
    return { erro: 'Erro ao processar a pergunta sobre o termo.' }
  }
}

function obterRespostaGlossarioLocal(verbete: VerbeteContext, pergunta: string): string {
  const query = pergunta.toLowerCase()
  const termo = verbete.termo

  if (query.includes('exemplo') || query.includes('prática') || query.includes('funciona')) {
    if (verbete.exemplo) {
      return `Aqui está um exemplo prático de como funciona o termo **${termo}**:\n\n*${verbete.exemplo}*`
    }
    return `O termo **${termo}** se aplica na prática do dia a dia legislativo e administrativo. Por exemplo, serve para estruturar processos públicos e decisões do orçamento ou votações.`
  }

  if (query.includes('porque importa') || query.includes('por que importa') || query.includes('importancia') || query.includes('técnico')) {
    if (verbete.definicao_tecnica) {
      return `Veja a importância técnica de **${termo}**:\n\n${verbete.definicao_tecnica}`
    }
  }

  return `Aqui está a explicação sobre **${termo}**:
- **O que significa:** ${verbete.definicao_simples}
${verbete.exemplo ? `- **Na prática:** *${verbete.exemplo}*` : ''}

Caso tenha dúvidas mais específicas, você pode consultar o regimento interno das Casas Legislativas ou a Constituição Federal.`
}
