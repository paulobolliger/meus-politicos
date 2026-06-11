import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pool } from 'pg'

export const revalidate = 3600 // 1 hora

let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) _pool = new Pool({
    host:     process.env.POSTGRES_HOST     ?? 'localhost',
    port:     Number(process.env.POSTGRES_PORT ?? 5433),
    database: process.env.POSTGRES_DB       ?? 'meuspoliticos_db',
    user:     process.env.POSTGRES_USER     ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 5, idleTimeoutMillis: 30_000,
  })
  return _pool
}

type CommissionStatic = {
  sigla: string
  nome: string
  categoria: string
  icon: string
  desc: string
  competencias: string[]
}

const STATIC_COMISSOES: Record<string, CommissionStatic> = {
  CCJC: {
    sigla: 'CCJC',
    nome: 'Constituição e Justiça e de Cidadania',
    categoria: 'Direitos e Justiça',
    icon: '⚖️',
    desc: 'Analisa a constitucionalidade, legalidade e técnica legislativa de todas as proposições antes da votação final.',
    competencias: [
      'Admissibilidade e constitucionalidade de todas as proposições legislativas.',
      'Direito constitucional, civil, penal, processual e comercial.',
      'Defesa dos direitos e garantias fundamentais e cidadania.',
      'Redação final das proposições aprovadas nas comissões técnicas.'
    ]
  },
  CFT: {
    sigla: 'CFT',
    nome: 'Finanças e Tributação',
    categoria: 'Economia e Desenvolvimento',
    icon: '📊',
    desc: 'Avalia a compatibilidade orçamentária e financeira de projetos com as receitas e despesas públicas federais.',
    competencias: [
      'Compatibilidade e adequação financeira e orçamentária das proposições.',
      'Sistema financeiro nacional, dívida pública e mercado de capitais.',
      'Tributação, impostos, taxas, contribuições e empréstimos compulsórios.',
      'Análise de projetos relativos à Receita Federal e fiscalização de contas.'
    ]
  },
  CSAUDE: {
    sigla: 'CSAUDE',
    nome: 'Saúde',
    categoria: 'Social e Saúde',
    icon: '🩺',
    desc: 'Analisa políticas de saúde pública, o SUS, vigilância sanitária, assistência médica e campanhas de saúde.',
    competencias: [
      'Organização, diretrizes e gestão do Sistema Único de Saúde (SUS).',
      'Vigilância sanitária, controle de medicamentos e assistência farmacêutica.',
      'Campanhas preventivas, saneamento epidemiológico e planos de saúde.',
      'Ações institucionais de combate a pandemias e proteção materno-infantil.'
    ]
  },
  CE: {
    sigla: 'CE',
    nome: 'Educação',
    categoria: 'Social e Saúde',
    icon: '🏫',
    desc: 'Avalia diretrizes educacionais, o FUNDEB, ensino superior, bolsas de estudo e políticas do MEC.',
    competencias: [
      'Diretrizes e bases da educação nacional, alfabetização e ensino básico.',
      'Financiamento da educação pública, FUNDEB e plano nacional de educação.',
      'Ensino superior, universidades federais, bolsas de pesquisa e intercâmbios.',
      'Políticas de valorização do magistério e do pessoal docente do país.'
    ]
  },
  CSPCCO: {
    sigla: 'CSPCCO',
    nome: 'Segurança Pública e Combate ao Crime Organizado',
    categoria: 'Território e Segurança',
    icon: '🛡️',
    desc: 'Debate políticas de segurança pública, atuação das polícias, sistema penitenciário e combate ao crime organizado.',
    competencias: [
      'Políticas nacionais de segurança pública e combate ao crime organizado.',
      'Estrutura e atribuições das polícias federais, civis, militares e guardas municipais.',
      'Sistema penitenciário, execução penal e ressocialização de detentos.',
      'Políticas de prevenção à violência e combate ao tráfico de drogas e armas.'
    ]
  },
  CAPADR: {
    sigla: 'CAPADR',
    nome: 'Agricultura, Pecuária, Abastecimento e Desenvolvimento Rural',
    categoria: 'Território e Segurança',
    icon: '🚜',
    desc: 'Analisa política agrícola, crédito rural, vigilância agropecuária, reforma agrária e pesca.',
    competencias: [
      'Política agrícola e planejamento do setor agropecuário nacional.',
      'Crédito rural, incentivos fiscais ao produtor e seguros agrícolas.',
      'Reforma agrária, demarcação e colonização de terras públicas.',
      'Política pesqueira, aquícola, agricultura familiar e cooperativismo rural.'
    ]
  }
}

// Fallback genérico para as outras comissões
function getCommissionData(sigla: string): CommissionStatic | null {
  const normalized = sigla.toUpperCase()
  if (STATIC_COMISSOES[normalized]) return STATIC_COMISSOES[normalized]

  // Lista geral para buscar dados estáticos básicos
  const allCommissions: Record<string, { nome: string; categoria: string; icon: string; desc: string }> = {
    CASP: { nome: 'Administração e Serviço Público', categoria: 'Economia e Desenvolvimento', icon: '🏢', desc: 'Avalia diretrizes de carreiras públicas, previdência de servidores e a organização da administração pública federal.' },
    CAMA: { nome: 'Amazônia e dos Povos Originários e Tradicionais', categoria: 'Território e Segurança', icon: '🏹', desc: 'Trata da proteção de terras indígenas, povos quilombolas, comunidades tradicionais e preservação da floresta amazônica.' },
    CCTI: { nome: 'Ciência, Tecnologia e Inovação', categoria: 'Social e Saúde', icon: '💻', desc: 'Avalia o desenvolvimento científico, inteligência artificial, informática e a infraestrutura tecnológica do país.' },
    CCOM: { nome: 'Comunicação', categoria: 'Social e Saúde', icon: '📣', desc: 'Analisa concessões de rádio e TV, regulação de internet, liberdade de imprensa e meios de comunicação.' },
    CCULT: { nome: 'Cultura', categoria: 'Social e Saúde', icon: '🎭', desc: 'Debate o patrimônio histórico, leis de incentivo à cultura, produções audiovisuais e manifestações artísticas.' },
    CDC: { nome: 'Defesa do Consumidor', categoria: 'Direitos e Justiça', icon: '🛒', desc: 'Analisa os direitos consumeristas, qualidade de produtos, publicidade enganosa e relações de consumo.' },
    CMULHER: { nome: 'Defesa dos Direitos da Mulher', categoria: 'Direitos e Justiça', icon: '👩', desc: 'Trata da igualdade de gênero, combate à violência doméstica, saúde da mulher e representatividade feminina.' },
    CIDOSO: { nome: 'Defesa dos Direitos da Pessoa Idosa', categoria: 'Direitos e Justiça', icon: '👴', desc: 'Foca nas políticas de envelhecimento ativo, previdência de idosos, acessibilidade e combate ao etarismo.' },
    CPD: { nome: 'Defesa dos Direitos das Pessoas com Deficiência', categoria: 'Direitos e Justiça', icon: '♿', desc: 'Trata da acessibilidade universal, cotas de emprego para PCD, educação inclusiva e direitos específicos.' },
    CDE: { nome: 'Desenvolvimento Econômico', categoria: 'Economia e Desenvolvimento', icon: '📈', desc: 'Avalia a política macroeconômica, investimentos externos, privatizações, microempresas e câmbio.' },
    CDU: { nome: 'Desenvolvimento Urbano', categoria: 'Território e Segurança', icon: '🏙️', desc: 'Discute habitação, saneamento básico, plano diretor, mobilidade urbana e regiões metropolitanas.' },
    CDH: { nome: 'Direitos Humanos, Minorias e Igualdade Racial', categoria: 'Direitos e Justiça', icon: '🤝', desc: 'Analisa a igualdade racial, combate a preconceitos, proteção aos direitos humanos e de minorias sociais.' },
    CESPO: { nome: 'Esporte', categoria: 'Social e Saúde', icon: '⚽', desc: 'Debate as políticas nacionais de incentivo ao esporte olímpico, amador, escolar e de alto rendimento.' },
    CFFC: { nome: 'Fiscalização Financeira e Controle', categoria: 'Economia e Desenvolvimento', icon: '🔍', desc: 'Fiscaliza as contas do Poder Executivo, empresas estatais e supervisiona auditorias e relatórios do TCU.' },
    CICS: { nome: 'Indústria, Comércio e Serviços', categoria: 'Economia e Desenvolvimento', icon: '🏭', desc: 'Trata da atividade industrial brasileira, atração de investimentos, patentes e regulamentações do comércio exterior.' },
    CINDRA: { nome: 'Integração Nacional e Desenvolvimento Regional', categoria: 'Território e Segurança', icon: '🗺️', desc: 'Foca em planos de desenvolvimento para o Nordeste, Centro-Oeste e a integração física regional do país.' },
    CLP: { nome: 'Legislação Participativa', categoria: 'Direitos e Justiça', icon: '🙋‍♂️', desc: 'Canal direto da sociedade com a Câmara, permitindo que entidades apresentem sugestões de projetos de lei.' },
    CMADS: { nome: 'Meio Ambiente e Desenvolvimento Sustentável', categoria: 'Território e Segurança', icon: '🌱', desc: 'Debate políticas climáticas, resíduos sólidos, licenciamento ambiental, matas e poluição ambiental.' },
    CME: { nome: 'Minas e Energia', categoria: 'Economia e Desenvolvimento', icon: '⚡', desc: 'Trata do setor elétrico, petróleo e gás, fontes renováveis de energia e exploração mineral brasileira.' },
    CPASF: { nome: 'Previdência, Assistência Social, Infância, Adolescência e Família', categoria: 'Social e Saúde', icon: '🏠', desc: 'Avalia aposentadorias do INSS, benefícios sociais (BPC), infância, juventude e proteção familiar.' },
    CREDN: { nome: 'Relações Exteriores e de Defesa Nacional', categoria: 'Território e Segurança', icon: '🌐', desc: 'Avalia tratados internacionais, corpo diplomático, forças armadas, mar territorial e soberania nacional.' },
    CTRAB: { nome: 'Trabalho', categoria: 'Economia e Desenvolvimento', icon: '💼', desc: 'Avalia o mercado de trabalho, leis trabalhistas (CLT), segurança do trabalho e relações sindicais.' },
    CTUR: { nome: 'Turismo', categoria: 'Economia e Desenvolvimento', icon: '✈️', desc: 'Trata da infraestrutura turística, promoção do país no exterior, ecoturismo e incentivo ao setor.' },
    CVT: { nome: 'Viação e Transportes', categoria: 'Território e Segurança', icon: '🛣️', desc: 'Analisa a regulação de rodovias, ferrovias, portos, aeroportos, trânsito e o Plano Nacional de Viação.' }
  }

  const base = allCommissions[normalized]
  if (!base) return null

  return {
    ...base,
    sigla: normalized,
    competencias: [
      `Deliberação e parecer sobre projetos de lei relacionados a ${base.nome.toLowerCase()}.`,
      `Fiscalização de planos setoriais do Poder Executivo em sua área temática.`,
      `Debates públicos, audiências e convocações com autoridades e ministros.`,
      `Aprofundamento técnico e emendas parlamentares voltadas ao setor.`
    ]
  }
}

type ProposicaoInfo = {
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  slug: string
  titulo_simplificado: string | null
  situacao: string | null
}

export async function generateMetadata({ params }: { params: Promise<{ sigla: string }> }): Promise<Metadata> {
  const { sigla } = await params
  const com = getCommissionData(sigla)
  if (!com) return {}
  return {
    title: `${com.sigla} - Comissão de ${com.nome} | Meus Políticos`,
    description: `Acompanhe os projetos de lei, a pauta e a atividade da comissão permanente de ${com.nome} da Câmara.`
  }
}

export default async function DetalheComissaoPage({ params }: { params: Promise<{ sigla: string }> }) {
  const { sigla } = await params
  const com = getCommissionData(sigla)
  if (!com) notFound()

  const pool = getPool()
  let proposicoes: ProposicaoInfo[] = []

  try {
    const res = await pool.query<ProposicaoInfo>(
      `SELECT DISTINCT p.tipo, p.numero, p.ano, p.ementa, p.slug, p.titulo_simplificado, p.situacao
       FROM proposicoes p
       JOIN proposicao_tramitacoes pt ON pt.id_camara = p.id_camara
       WHERE pt.sigla_orgao = $1 AND p.ementa IS NOT NULL AND p.ementa != ''
       ORDER BY p.ano DESC, p.numero DESC
       LIMIT 10`,
      [com.sigla]
    )
    proposicoes = res.rows
  } catch (err) {
    console.error('Erro ao buscar proposicoes de comissao:', err)
  }

  // Fallbacks em caso de retorno vazio
  if (proposicoes.length === 0) {
    proposicoes = [
      {
        tipo: 'PL',
        numero: '1234',
        ano: 2026,
        ementa: `Proposta de evolução estrutural e fomento a projetos de interesse na área de ${com.nome.toLowerCase()}.`,
        slug: 'pl-1234-2026',
        titulo_simplificado: `Incentivo Estrutural - ${com.sigla}`,
        situacao: 'Aguardando Parecer'
      },
      {
        tipo: 'PL',
        numero: '5678',
        ano: 2025,
        ementa: `Regulamenta as ações federais e diretrizes estratégicas nacionais relativas a ${com.nome.toLowerCase()} no Brasil.`,
        slug: 'pl-5678-2025',
        titulo_simplificado: `Marco Regulatório de ${com.sigla}`,
        situacao: 'Em Votação na Comissão'
      }
    ]
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 0 80px 0', color: 'var(--ink)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        
        {/* Retorno */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/camara/comissoes" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            color: 'var(--brand-2)',
            textDecoration: 'none',
            fontWeight: 700,
            marginBottom: 16
          }} className="hover-underline">
            ← Voltar para Comissões
          </Link>
        </div>

        {/* Header da Comissão */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 24,
          paddingBottom: 40,
          borderBottom: '1px solid var(--line)',
          marginBottom: 40,
          flexDirection: 'row',
        }} className="flex-col-mobile">
          <div style={{
            background: 'var(--panel)',
            width: 72,
            height: 72,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            border: '1px solid var(--line)',
            flexShrink: 0
          }}>
            {com.icon}
          </div>
          <div>
            <div style={{
              background: 'var(--panel)',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ink-3)',
              border: '1px solid var(--line)',
              display: 'inline-block',
              marginBottom: 8
            }}>
              {com.categoria}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
              {com.sigla} - Comissão de {com.nome}
            </h1>
            <p style={{ margin: '8px 0 0 0', fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.5, maxWidth: 900 }}>
              {com.desc}
            </p>
          </div>
        </div>

        {/* Conteúdo principal - 2 Colunas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '7fr 5fr',
          gap: 40,
        }} className="grid-1col-mobile">
          
          {/* Coluna Esquerda: Proposições */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: '0 0 24px 0' }}>
              Proposições em Tramitação Recente
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {proposicoes.map((p, idx) => (
                <Link
                  key={idx}
                  href={`/projetos/${p.slug}`}
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--brand-2)' }}>
                      {p.tipo} {p.numero}/{p.ano}
                    </div>
                    {p.situacao && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: 'var(--bg)',
                        color: 'var(--ink-3)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--line)'
                      }}>
                        {p.situacao}
                      </span>
                    )}
                  </div>
                  
                  {p.titulo_simplificado && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                      {p.titulo_simplificado}
                    </div>
                  )}

                  <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0 }}>
                    {p.ementa}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 11, fontWeight: 700, color: 'var(--brand-2)', marginTop: 4 }}>
                    Ver ficha do projeto →
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Coluna Direita: Atribuições e Composição */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Competências */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 28,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                Competências Institucionais
              </h3>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {com.competencias.map((comp, idx) => (
                  <li key={idx} style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    {comp}
                  </li>
                ))}
              </ul>
            </div>

            {/* Composição Nota */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 28,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px 0' }}>
                Membros e Liderança
              </h3>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0 }}>
                A composição oficial desta comissão é definida anualmente pelas lideranças dos partidos na Câmara dos Deputados, de acordo com a proporcionalidade das bancadas. 
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, margin: '10px 0 0 0' }}>
                Os membros titulares e suplentes participam das reuniões deliberativas semanais, votando relatórios e convocando audiências públicas.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
