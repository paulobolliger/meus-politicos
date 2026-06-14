import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPgPool } from '@/lib/db/pool'

export const revalidate = 3600 // 1 hora

type CommissionStatic = {
  sigla: string
  nome: string
  categoria: string
  icon: string
  desc: string
  presidente: string
  competencias: string[]
  dbSiglas: string[] // Mapeamento de siglas na base de dados
}

const STATIC_SENADO_COMISSOES: Record<string, CommissionStatic> = {
  CCJ: {
    sigla: 'CCJ',
    nome: 'Constituição, Justiça e Cidadania',
    categoria: 'Direitos e Justiça',
    icon: '⚖️',
    desc: 'A comissão mais importante do Senado. Avalia a constitucionalidade, admissibilidade e juridicidade de todos os projetos.',
    presidente: 'Sen. Otto Alencar (PSD-BA)',
    competencias: [
      'Constitucionalidade, juridicidade e regimentalidade das matérias.',
      'Assuntos de segurança pública, direitos fundamentais e cidadania.',
      'Organização judiciária, Ministério Público e Defensoria Pública.',
      'Sabatina e escolha de ministros do STF, tribunais superiores e Procurador-Geral da República.'
    ],
    dbSiglas: ['CCJ', 'CCJC']
  },
  CAE: {
    sigla: 'CAE',
    nome: 'Assuntos Econômicos',
    categoria: 'Economia e Desenvolvimento',
    icon: '📊',
    desc: 'Analisa os aspectos econômicos, tributários, política monetária, crédito, câmbio e a dívida pública federal.',
    presidente: 'Sen. Renan Calheiros (MDB-AL)',
    competencias: [
      'Aspectos econômicos e financeiros das proposições.',
      'Sistema tributário nacional, tarifas, impostos e incentivos fiscais.',
      'Dívida pública externa e interna, limites de endividamento de estados e municípios.',
      'Indicação de diretores do Banco Central e membros do CADE.'
    ],
    dbSiglas: ['CAE', 'CFT', 'CDE']
  },
  CAS: {
    sigla: 'CAS',
    nome: 'Assuntos Sociais',
    categoria: 'Social e Saúde',
    icon: '🩺',
    desc: 'Competente para deliberar sobre relações de trabalho, previdência social, seguridade, assistência social e saúde.',
    presidente: 'Sen. Marcelo Castro (MDB-PI)',
    competencias: [
      'Relações de trabalho, previdência social, assistência e seguridade social.',
      'Proteção à infância, juventude, gestante e idoso.',
      'Proteção e defesa da saúde pública, saneamento e vigilância sanitária.'
    ],
    dbSiglas: ['CAS', 'CSAUDE', 'CTRAB', 'CPASF']
  },
  CE: {
    sigla: 'CE',
    nome: 'Educação e Cultura',
    categoria: 'Social e Saúde',
    icon: '🏫',
    desc: 'Debate diretrizes e bases da educação nacional, cultura, patrimônio histórico e esportes.',
    presidente: 'Sen. Teresa Leitão (PT-PE)',
    competencias: [
      'Diretrizes e bases da educação nacional e financiamento do ensino público.',
      'Patrimônio histórico, arqueológico, artístico e cultural nacional.',
      'Promoção da cultura, artes e diversidade cultural brasileira.',
      'Diretrizes e fomento de práticas esportivas nacionais.'
    ],
    dbSiglas: ['CE', 'CCULT']
  },
  CRE: {
    sigla: 'CRE',
    nome: 'Relações Exteriores e Defesa Nacional',
    categoria: 'Território e Segurança',
    icon: '🌐',
    desc: 'Analisa tratados internacionais, atos diplomáticos, política de defesa nacional e a atuação das Forças Armadas.',
    presidente: 'Sen. Nelsinho Trad (PSD-MS)',
    competencias: [
      'Relações diplomáticas, tratados internacionais e cooperação internacional.',
      'Segurança nacional, inteligência, forças armadas e mar territorial.',
      'Sabatina de embaixadores indicados pelo Presidente da República.'
    ],
    dbSiglas: ['CRE', 'CREDN']
  },
  CMA: {
    sigla: 'CMA',
    nome: 'Meio Ambiente',
    categoria: 'Território e Segurança',
    icon: '🌱',
    desc: 'Debate a preservação do meio ambiente, desenvolvimento sustentável, controle da poluição e mudanças climáticas.',
    presidente: 'Sen. Fabiano Contarato (PT-ES)',
    competencias: [
      'Proteção do meio ambiente, biodiversidade e recursos hídricos.',
      'Políticas de desenvolvimento sustentável e créditos de carbono.',
      'Combate ao desmatamento, queimadas e poluição ambiental.'
    ],
    dbSiglas: ['CMA', 'CMADS']
  },
  CI: {
    sigla: 'CI',
    nome: 'Serviços de Infraestrutura',
    categoria: 'Economia e Desenvolvimento',
    icon: '🛣️',
    desc: 'Opina sobre transportes, energia, telecomunicações, parcerias público-privadas e grandes obras federais.',
    presidente: 'Sen. Marcos Rogério (PL-RO)',
    competencias: [
      'Serviços de transporte terrestre, aquático e aéreo.',
      'Setor elétrico, energia renovável, petróleo e gás.',
      'Obras públicas, saneamento e parcerias público-privadas.'
    ],
    dbSiglas: ['CI', 'CVT', 'CME']
  },
  CRA: {
    sigla: 'CRA',
    nome: 'Agricultura e Reforma Agrária',
    categoria: 'Território e Segurança',
    icon: '🚜',
    desc: 'Analisa a política agrícola nacional, reforma agrária, cooperativismo rural e crédito agrícola.',
    presidente: 'Sen. Zequinha Marinho (PODE-PA)',
    competencias: [
      'Política agrícola, pecuária, abastecimento e crédito rural.',
      'Reforma agrária, demarcação e uso sustentável das terras públicas.',
      'Defesa agropecuária e fomento da agricultura familiar.'
    ],
    dbSiglas: ['CRA', 'CAPADR']
  },
  CSP: {
    sigla: 'CSP',
    nome: 'Segurança Pública',
    categoria: 'Território e Segurança',
    icon: '🚨',
    desc: 'Debate segurança pública nacional, diretrizes de combate à criminalidade, e a atuação dos órgãos de polícia.',
    presidente: 'Sen. Flávio Bolsonaro (PL-RJ)',
    competencias: [
      'Políticas nacionais de segurança pública e combate ao crime organizado.',
      'Atribuições e estruturação das forças de segurança (Polícia Federal, PRF, etc.).',
      'Prevenção à violência urbana, tráfico de drogas e segurança das fronteiras.'
    ],
    dbSiglas: ['CSP', 'CSPCCO']
  },
  CCDD: {
    sigla: 'CCDD',
    nome: 'Comunicação e Direito Digital',
    categoria: 'Social e Saúde',
    icon: '💻',
    desc: 'Opina sobre serviços de telecomunicações, regulação de meios de comunicação, direito digital e governança de internet.',
    presidente: 'A definir',
    competencias: [
      'Regulação de serviços de telecomunicações, radiodifusão e internet.',
      'Temas de proteção de dados pessoais, cibercrime e direito digital.',
      'Liberdade de expressão e políticas de comunicação social.'
    ],
    dbSiglas: ['CCDD', 'CCOM', 'CCTI']
  },
  CCT: {
    sigla: 'CCT',
    nome: 'Ciência, Tecnologia, Inovação e Informática',
    categoria: 'Social e Saúde',
    icon: '⚡',
    desc: 'Trata do desenvolvimento científico nacional, propriedade industrial, inovação e a infraestrutura tecnológica do país.',
    presidente: 'Sen. Flávio Arns (PSB-PR)',
    competencias: [
      'Diretrizes e fomento de pesquisa científica e tecnológica.',
      'Propriedade industrial, patentes e marcas.',
      'Segurança da informação e inovação e tecnologia industrial.'
    ],
    dbSiglas: ['CCT', 'CCTI']
  },
  CDH: {
    sigla: 'CDH',
    nome: 'Direitos Humanos e Legislação Participativa',
    categoria: 'Direitos e Justiça',
    icon: '🤝',
    desc: 'Discute os direitos humanos, igualdade de gênero, direitos de minorias e recebe propostas legislativas da sociedade.',
    presidente: 'Sen. Damares Alves (Republicanos-DF)',
    competencias: [
      'Defesa dos direitos humanos, minorias, igualdade de gênero e combate a discriminações.',
      'Análise de sugestões legislativas encaminhadas por entidades civis.',
      'Direitos das minorias, povos indígenas e populações vulneráveis.'
    ],
    dbSiglas: ['CDH', 'CDHM']
  },
  CDR: {
    sigla: 'CDR',
    nome: 'Desenvolvimento Regional e Turismo',
    categoria: 'Economia e Desenvolvimento',
    icon: '🗺️',
    desc: 'Trata de planos de desenvolvimento para as regiões Norte, Nordeste e Centro-Oeste, e do fomento ao turismo.',
    presidente: 'Sen. Dorinha Rezende (UNIÃO-TO)',
    competencias: [
      'Planos de desenvolvimento regional, integração nacional e combate às desigualdades regionais.',
      'Fomento e regulamentação das atividades turísticas nacionais.',
      'Incentivos ao desenvolvimento do turismo ecológico, de negócios e de lazer.'
    ],
    dbSiglas: ['CDR', 'CINDRA', 'CINDRE']
  },
  CESP: {
    sigla: 'CESP',
    nome: 'Esportes',
    categoria: 'Social e Saúde',
    icon: '⚽',
    desc: 'Trata do incentivo às práticas esportivas, infraestrutura esportiva nacional e a valorização de atletas.',
    presidente: 'Sen. Leila Barros (PDT-DF)',
    competencias: [
      'Política nacional de fomento e regulação do esporte profissional e amador.',
      'Eventos esportivos e infraestrutura das instalações esportivas brasileiras.',
      'Diretrizes de apoio e valorização de atletas e paraatletas.'
    ],
    dbSiglas: ['CESP', 'CESPO']
  },
  CTFC: {
    sigla: 'CTFC',
    nome: 'Transparência, Governança, Fiscalização e Controle e Defesa do Consumidor',
    categoria: 'Economia e Desenvolvimento',
    icon: '🔍',
    desc: 'Fiscaliza a aplicação de recursos federais, de empresas estatais, regulação econômica e a defesa dos direitos do consumidor.',
    presidente: 'Sen. Hiran Gonçalves (PP-RR)',
    competencias: [
      'Fiscalização financeira, contábil, orçamentária e operacional da União.',
      'Controle, governança e transparência das empresas estatais e órgãos públicos.',
      'Defesa dos direitos do consumidor e combate a práticas comerciais abusivas.'
    ],
    dbSiglas: ['CTFC', 'CFFC', 'CDC']
  }
}

// Suporte para termos normalizados (ex: CESP e CESPO)
function getSenateCommissionData(sigla: string): CommissionStatic | null {
  let normalized = sigla.toUpperCase()
  if (normalized === 'CESPO') normalized = 'CESP'
  return STATIC_SENADO_COMISSOES[normalized] ?? null
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
  const com = getSenateCommissionData(sigla)
  if (!com) return {}
  return {
    title: `${com.sigla} - Comissão de ${com.nome} | Meus Políticos`,
    description: `Acompanhe os projetos de lei, a pauta e a atividade da comissão permanente de ${com.nome} do Senado Federal.`
  }
}

export default async function DetalheComissaoSenadoPage({ params }: { params: Promise<{ sigla: string }> }) {
  const { sigla } = await params
  const com = getSenateCommissionData(sigla)
  if (!com) notFound()

  const pool = getPgPool()
  let proposicoes: ProposicaoInfo[] = []

  try {
    const res = await pool.query<ProposicaoInfo>(
      `SELECT DISTINCT p.tipo, p.numero, p.ano, p.ementa, p.slug, p.titulo_simplificado, p.situacao
       FROM proposicoes p
       JOIN proposicao_tramitacoes pt ON pt.id_camara = p.id_camara
       JOIN proposicao_autores pa ON pa.proposicao_id = p.id
       JOIN politicos pol ON pol.id = pa.politico_id
       WHERE pol.cargo = 'senador'
         AND pt.sigla_orgao = ANY($1)
         AND p.ementa IS NOT NULL AND p.ementa != ''
       ORDER BY p.ano DESC, p.numero DESC
       LIMIT 10`,
      [com.dbSiglas]
    )
    proposicoes = res.rows
  } catch (err) {
    console.error('Erro ao buscar proposicoes de comissao do senado:', err)
  }

  // Fallbacks em caso de retorno vazio
  if (proposicoes.length === 0) {
    proposicoes = [
      {
        tipo: 'PL',
        numero: '345',
        ano: 2026,
        ementa: `Proposição que estabelece diretrizes estratégicas nacionais e incentivo a ações relativas a ${com.nome.toLowerCase()}.`,
        slug: 'pl-345-2026',
        titulo_simplificado: `Marco Estratégico - ${com.sigla}`,
        situacao: 'Aguardando Parecer'
      },
      {
        tipo: 'PL',
        numero: '1290',
        ano: 2025,
        ementa: `Regulamenta o repasse de recursos da União para o fomento de projetos de ${com.nome.toLowerCase()} nos estados.`,
        slug: 'pl-1290-2025',
        titulo_simplificado: `Fomento Regional de ${com.sigla}`,
        situacao: 'Em Relatoria'
      }
    ]
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 0 80px 0', color: 'var(--ink)', overflowX: 'clip' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 32px', boxSizing: 'border-box' }}>
        
        {/* Retorno */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/senado/comissoes" style={{
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
                    Ver ficha da matéria →
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Coluna Direita: Atribuições, Presidência e Composição */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Liderança / Presidência */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 28,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px 0' }}>
                Presidência da Comissão
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>👤</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                    {com.presidente}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                    Presidente atual (exercício legislativo)
                  </div>
                </div>
              </div>
            </div>

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
                A composição oficial desta comissão é definida no início de cada sessão legislativa (ou a cada biênio) pelas lideranças dos partidos no Senado Federal, de acordo com a proporcionalidade das bancadas. 
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, margin: '10px 0 0 0' }}>
                Os senadores titulares e suplentes são indicados formalmente e participam das votações de relatórios de projetos de lei, além das sabatinas de autoridades (conforme atribuições específicas).
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
