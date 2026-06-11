'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export type ComissaoInfo = {
  sigla: string
  nome: string
  categoria: 'Direitos e Justiça' | 'Economia e Desenvolvimento' | 'Social e Saúde' | 'Território e Segurança'
  icon: string
  desc: string
}

const COMISSOES_LIST: ComissaoInfo[] = [
  {
    sigla: 'CCJC',
    nome: 'Constituição e Justiça e de Cidadania',
    categoria: 'Direitos e Justiça',
    icon: '⚖️',
    desc: 'Analisa a constitucionalidade, legalidade e redação de todas as propostas legislativas da Câmara.'
  },
  {
    sigla: 'CFT',
    nome: 'Finanças e Tributação',
    categoria: 'Economia e Desenvolvimento',
    icon: '📊',
    desc: 'Avalia o impacto financeiro e orçamentário de todas as proposições que aumentem gastos ou alterem tributos.'
  },
  {
    sigla: 'CSAUDE',
    nome: 'Saúde',
    categoria: 'Social e Saúde',
    icon: '🩺',
    desc: 'Analisa políticas de saúde pública, o SUS, vigilância sanitária, assistência médica e campanhas de saúde.'
  },
  {
    sigla: 'CE',
    nome: 'Educação',
    categoria: 'Social e Saúde',
    icon: '🏫',
    desc: 'Avalia diretrizes educacionais, o FUNDEB, ensino superior, bolsas de estudo e políticas do MEC.'
  },
  {
    sigla: 'CSPCCO',
    nome: 'Segurança Pública e Combate ao Crime Organizado',
    categoria: 'Território e Segurança',
    icon: '🛡️',
    desc: 'Debate políticas de segurança pública, sistema carcerário, crimes hediondos e o combate a facções.'
  },
  {
    sigla: 'CAPADR',
    nome: 'Agricultura, Pecuária, Abastecimento e Desenvolvimento Rural',
    categoria: 'Território e Segurança',
    icon: '🚜',
    desc: 'Analisa política agrícola, crédito rural, vigilância agropecuária, reforma agrária e pesca.'
  },
  {
    sigla: 'CASP',
    nome: 'Administração e Serviço Público',
    categoria: 'Economia e Desenvolvimento',
    icon: '🏢',
    desc: 'Avalia diretrizes de carreiras públicas, previdência de servidores e a organização da administração pública federal.'
  },
  {
    sigla: 'CAMA',
    nome: 'Amazônia e dos Povos Originários e Tradicionais',
    categoria: 'Território e Segurança',
    icon: '🏹',
    desc: 'Trata da proteção de terras indígenas, povos quilombolas, comunidades tradicionais e preservação da floresta amazônica.'
  },
  {
    sigla: 'CCTI',
    nome: 'Ciência, Tecnologia e Inovação',
    categoria: 'Social e Saúde',
    icon: '💻',
    desc: 'Avalia o desenvolvimento científico, inteligência artificial, informática e a infraestrutura tecnológica do país.'
  },
  {
    sigla: 'CCOM',
    nome: 'Comunicação',
    categoria: 'Social e Saúde',
    icon: '📣',
    desc: 'Analisa concessões de rádio e TV, regulação de internet, liberdade de imprensa e meios de comunicação.'
  },
  {
    sigla: 'CCULT',
    nome: 'Cultura',
    categoria: 'Social e Saúde',
    icon: '🎭',
    desc: 'Debate o patrimônio histórico, leis de incentivo à cultura, produções audiovisuais e manifestações artísticas.'
  },
  {
    sigla: 'CDC',
    nome: 'Defesa do Consumidor',
    categoria: 'Direitos e Justiça',
    icon: '🛒',
    desc: 'Analisa os direitos consumeristas, qualidade de produtos, publicidade enganosa e relações de consumo.'
  },
  {
    sigla: 'CMULHER',
    nome: 'Defesa dos Direitos da Mulher',
    categoria: 'Direitos e Justiça',
    icon: '👩',
    desc: 'Trata da igualdade de gênero, combate à violência doméstica, saúde da mulher e representatividade feminina.'
  },
  {
    sigla: 'CIDOSO',
    nome: 'Defesa dos Direitos da Pessoa Idosa',
    categoria: 'Direitos e Justiça',
    icon: '👴',
    desc: 'Foca nas políticas de envelhecimento ativo, previdência de idosos, acessibilidade e combate ao etarismo.'
  },
  {
    sigla: 'CPD',
    nome: 'Defesa dos Direitos das Pessoas com Deficiência',
    categoria: 'Direitos e Justiça',
    icon: '♿',
    desc: 'Trata da acessibilidade universal, cotas de emprego para PCD, educação inclusiva e direitos específicos.'
  },
  {
    sigla: 'CDE',
    nome: 'Desenvolvimento Econômico',
    categoria: 'Economia e Desenvolvimento',
    icon: '📈',
    desc: 'Avalia a política macroeconômica, investimentos externos, privatizações, microempresas e câmbio.'
  },
  {
    sigla: 'CDU',
    nome: 'Desenvolvimento Urbano',
    categoria: 'Território e Segurança',
    icon: '🏙️',
    desc: 'Discute habitação, saneamento básico, plano diretor, mobilidade urbana e regiões metropolitanas.'
  },
  {
    sigla: 'CDH',
    nome: 'Direitos Humanos, Minorias e Igualdade Racial',
    categoria: 'Direitos e Justiça',
    icon: '🤝',
    desc: 'Analisa a igualdade racial, combate a preconceitos, proteção aos direitos humanos e de minorias sociais.'
  },
  {
    sigla: 'CESPO',
    nome: 'Esporte',
    categoria: 'Social e Saúde',
    icon: '⚽',
    desc: 'Debate as políticas nacionais de incentivo ao esporte olímpico, amador, escolar e de alto rendimento.'
  },
  {
    sigla: 'CFFC',
    nome: 'Fiscalização Financeira e Controle',
    categoria: 'Economia e Desenvolvimento',
    icon: '🔍',
    desc: 'Fiscaliza as contas do Poder Executivo, empresas estatais e supervisiona auditorias e relatórios do TCU.'
  },
  {
    sigla: 'CICS',
    nome: 'Indústria, Comércio e Serviços',
    categoria: 'Economia e Desenvolvimento',
    icon: '🏭',
    desc: 'Trata da atividade industrial brasileira, atração de investimentos, patentes e regulamentações do comércio exterior.'
  },
  {
    sigla: 'CINDRA',
    nome: 'Integração Nacional e Desenvolvimento Regional',
    categoria: 'Território e Segurança',
    icon: '🗺️',
    desc: 'Foca em planos de desenvolvimento para o Nordeste, Centro-Oeste e a integração física regional do país.'
  },
  {
    sigla: 'CLP',
    nome: 'Legislação Participativa',
    categoria: 'Direitos e Justiça',
    icon: '🙋‍♂️',
    desc: 'Canal direto da sociedade com a Câmara, permitindo que entidades apresentem sugestões de projetos de lei.'
  },
  {
    sigla: 'CMADS',
    nome: 'Meio Ambiente e Desenvolvimento Sustentável',
    categoria: 'Território e Segurança',
    icon: '🌱',
    desc: 'Debate políticas climáticas, resíduos sólidos, licenciamento ambiental, matas e poluição ambiental.'
  },
  {
    sigla: 'CME',
    nome: 'Minas e Energia',
    categoria: 'Economia e Desenvolvimento',
    icon: '⚡',
    desc: 'Trata do setor elétrico, petróleo e gás, fontes renováveis de energia e exploração mineral brasileira.'
  },
  {
    sigla: 'CPASF',
    nome: 'Previdência, Assistência Social, Infância, Adolescência e Família',
    categoria: 'Social e Saúde',
    icon: '🏠',
    desc: 'Avalia aposentadorias do INSS, benefícios sociais (BPC), infância, juventude e proteção familiar.'
  },
  {
    sigla: 'CREDN',
    nome: 'Relações Exteriores e de Defesa Nacional',
    categoria: 'Território e Segurança',
    icon: '🌐',
    desc: 'Avalia tratados internacionais, corpo diplomático, forças armadas, mar territorial e soberania nacional.'
  },
  {
    sigla: 'CTRAB',
    nome: 'Trabalho',
    categoria: 'Economia e Desenvolvimento',
    icon: '💼',
    desc: 'Avalia o mercado de trabalho, leis trabalhistas (CLT), segurança do trabalho e relações sindicais.'
  },
  {
    sigla: 'CTUR',
    nome: 'Turismo',
    categoria: 'Economia e Desenvolvimento',
    icon: '✈️',
    desc: 'Trata da infraestrutura turística, promoção do país no exterior, ecoturismo e incentivo ao setor.'
  },
  {
    sigla: 'CVT',
    nome: 'Viação e Transportes',
    categoria: 'Território e Segurança',
    icon: '🛣️',
    desc: 'Analisa a regulação de rodovias, ferrovias, portos, aeroportos, trânsito e o Plano Nacional de Viação.'
  }
]

export function ComissoesClient() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'Todas' | ComissaoInfo['categoria']>('Todas')

  const tabs: ('Todas' | ComissaoInfo['categoria'])[] = [
    'Todas',
    'Direitos e Justiça',
    'Economia e Desenvolvimento',
    'Social e Saúde',
    'Território e Segurança'
  ]

  const filtered = useMemo(() => {
    return COMISSOES_LIST.filter(c => {
      const matchSearch =
        c.sigla.toLowerCase().includes(search.toLowerCase()) ||
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.desc.toLowerCase().includes(search.toLowerCase())
      
      const matchTab = activeTab === 'Todas' || c.categoria === activeTab

      return matchSearch && matchTab
    })
  }, [search, activeTab])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 0 80px 0', color: 'var(--ink)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        
        {/* Retorno e Título */}
        <div style={{ marginBottom: 40 }}>
          <Link href="/camara" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            color: 'var(--brand-2)',
            textDecoration: 'none',
            fontWeight: 700,
            marginBottom: 16
          }} className="hover-underline">
            ← Voltar para a Câmara
          </Link>
          
          <div className="label" style={{ marginBottom: 8 }}>Órgãos Técnicos</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            Comissões Permanentes da Câmara
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: 16, color: 'var(--ink-3)', maxWidth: 800, lineHeight: 1.5 }}>
            Aqui você encontra todas as 30 comissões permanentes responsáveis por analisar, debater e deliberar sobre as propostas antes da votação no Plenário. Clique em qualquer comissão para ver seus detalhes e projetos em andamento.
          </p>
        </div>

        {/* Barra de Filtros e Busca */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          marginBottom: 32,
          padding: 24,
          background: 'var(--panel)',
          borderRadius: 16,
          border: '1px solid var(--line)'
        }}>
          {/* Busca */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar comissão por sigla ou nome (ex: CCJC, Educação, Economia)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 10,
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                fontSize: 15,
                fontWeight: 500,
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              className="search-input"
            />
          </div>

          {/* Categorias */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            borderTop: '1px solid var(--line)',
            paddingTop: 16
          }}>
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid var(--line)',
                  background: activeTab === tab ? 'var(--brand-2)' : 'var(--bg)',
                  color: activeTab === tab ? '#ffffff' : 'var(--ink-3)',
                  transition: 'all 0.2s'
                }}
                className={activeTab !== tab ? 'hover-card' : ''}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>
            Exibindo {filtered.length} comissões
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            color: 'var(--ink-3)'
          }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🔍</span>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>Nenhuma comissão encontrada para a busca.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>Tente mudar os termos da pesquisa ou a aba de categoria selecionada.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24
          }}>
            {filtered.map((c, idx) => (
              <Link
                key={idx}
                href={`/camara/comissoes/${c.sigla.toLowerCase()}`}
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                className="hover-card"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    background: 'var(--bg)',
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    border: '1px solid var(--line)',
                    flexShrink: 0
                  }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-2)', lineHeight: 1.2 }}>
                      {c.sigla}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginTop: 4, lineHeight: 1.3 }}>
                      {c.nome}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0, flexGrow: 1 }}>
                  {c.desc}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--line)',
                  paddingTop: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--brand-2)'
                }}>
                  <span style={{
                    background: 'var(--bg)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    fontSize: 10,
                    color: 'var(--ink-3)'
                  }}>
                    {c.categoria}
                  </span>
                  <span>Ver projetos →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
