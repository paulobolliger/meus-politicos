'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export type ComissaoSenadoInfo = {
  sigla: string
  nome: string
  categoria: 'Direitos e Justiça' | 'Economia e Desenvolvimento' | 'Social e Saúde' | 'Território e Segurança'
  icon: string
  desc: string
  presidente?: string
}

const COMISSOES_SENADO_LIST: ComissaoSenadoInfo[] = [
  {
    sigla: 'CCJ',
    nome: 'Constituição, Justiça e Cidadania',
    categoria: 'Direitos e Justiça',
    icon: '⚖️',
    desc: 'Avalia a constitucionalidade, admissibilidade e juridicidade de todas as propostas legislativas apresentadas.',
    presidente: 'Sen. Otto Alencar (PSD-BA)'
  },
  {
    sigla: 'CAE',
    nome: 'Assuntos Econômicos',
    categoria: 'Economia e Desenvolvimento',
    icon: '📊',
    desc: 'Analisa os aspectos econômicos, tributários, política monetária, crédito, câmbio e a dívida pública federal.',
    presidente: 'Sen. Renan Calheiros (MDB-AL)'
  },
  {
    sigla: 'CAS',
    nome: 'Assuntos Sociais',
    categoria: 'Social e Saúde',
    icon: '🩺',
    desc: 'Competente para deliberar sobre relações de trabalho, previdência social, seguridade, assistência social e saúde.',
    presidente: 'Sen. Marcelo Castro (MDB-PI)'
  },
  {
    sigla: 'CE',
    nome: 'Educação e Cultura',
    categoria: 'Social e Saúde',
    icon: '🏫',
    desc: 'Debate diretrizes e bases da educação nacional, cultura, patrimônio histórico e esportes.',
    presidente: 'Sen. Teresa Leitão (PT-PE)'
  },
  {
    sigla: 'CRE',
    nome: 'Relações Exteriores e Defesa Nacional',
    categoria: 'Território e Segurança',
    icon: '🌐',
    desc: 'Analisa tratados internacionais, atos diplomáticos, política de defesa nacional e a atuação das Forças Armadas.',
    presidente: 'Sen. Nelsinho Trad (PSD-MS)'
  },
  {
    sigla: 'CMA',
    nome: 'Meio Ambiente',
    categoria: 'Território e Segurança',
    icon: '🌱',
    desc: 'Debate a preservação do meio ambiente, desenvolvimento sustentável, controle da poluição e mudanças climáticas.',
    presidente: 'Sen. Fabiano Contarato (PT-ES)'
  },
  {
    sigla: 'CI',
    nome: 'Serviços de Infraestrutura',
    categoria: 'Economia e Desenvolvimento',
    icon: '🛣️',
    desc: 'Opina sobre transportes, energia, telecomunicações, parcerias público-privadas e grandes obras federais.',
    presidente: 'Sen. Marcos Rogério (PL-RO)'
  },
  {
    sigla: 'CRA',
    nome: 'Agricultura e Reforma Agrária',
    categoria: 'Território e Segurança',
    icon: '🚜',
    desc: 'Analisa a política agrícola nacional, reforma agrária, cooperativismo rural e crédito agrícola.',
    presidente: 'Sen. Zequinha Marinho (PODE-PA)'
  },
  {
    sigla: 'CSP',
    nome: 'Segurança Pública',
    categoria: 'Território e Segurança',
    icon: '🚨',
    desc: 'Debate segurança pública nacional, diretrizes de combate à criminalidade, e a atuação dos órgãos de polícia.',
    presidente: 'Sen. Flávio Bolsonaro (PL-RJ)'
  },
  {
    sigla: 'CCDD',
    nome: 'Comunicação e Direito Digital',
    categoria: 'Social e Saúde',
    icon: '💻',
    desc: 'Opina sobre serviços de telecomunicações, regulação de meios de comunicação, direito digital e governança de internet.',
    presidente: 'A definir'
  },
  {
    sigla: 'CCT',
    nome: 'Ciência, Tecnologia, Inovação e Informática',
    categoria: 'Social e Saúde',
    icon: '⚡',
    desc: 'Trata do desenvolvimento científico nacional, propriedade industrial, inovação e a infraestrutura tecnológica do país.',
    presidente: 'Sen. Flávio Arns (PSB-PR)'
  },
  {
    sigla: 'CDH',
    nome: 'Direitos Humanos e Legislação Participativa',
    categoria: 'Direitos e Justiça',
    icon: '🤝',
    desc: 'Discute os direitos humanos, igualdade de gênero, direitos de minorias e recebe propostas legislativas da sociedade.',
    presidente: 'Sen. Damares Alves (Republicanos-DF)'
  },
  {
    sigla: 'CDR',
    nome: 'Desenvolvimento Regional e Turismo',
    categoria: 'Economia e Desenvolvimento',
    icon: '🗺️',
    desc: 'Trata de planos de desenvolvimento para as regiões Norte, Nordeste e Centro-Oeste, e do fomento ao turismo.',
    presidente: 'Sen. Dorinha Rezende (UNIÃO-TO)'
  },
  {
    sigla: 'CEsp',
    nome: 'Esportes',
    categoria: 'Social e Saúde',
    icon: '⚽',
    desc: 'Trata do incentivo às práticas esportivas, infraestrutura esportiva nacional e a valorização de atletas.',
    presidente: 'Sen. Leila Barros (PDT-DF)'
  },
  {
    sigla: 'CTFC',
    nome: 'Transparência, Governança, Fiscalização e Controle e Defesa do Consumidor',
    categoria: 'Economia e Desenvolvimento',
    icon: '🔍',
    desc: 'Fiscaliza a aplicação de recursos federais, de empresas estatais, regulação econômica e a defesa dos direitos do consumidor.',
    presidente: 'Sen. Hiran Gonçalves (PP-RR)'
  }
]

export function ComissoesSenadoClient() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'Todas' | ComissaoSenadoInfo['categoria']>('Todas')

  const tabs: ('Todas' | ComissaoSenadoInfo['categoria'])[] = [
    'Todas',
    'Direitos e Justiça',
    'Economia e Desenvolvimento',
    'Social e Saúde',
    'Território e Segurança'
  ]

  const filtered = useMemo(() => {
    return COMISSOES_SENADO_LIST.filter(c => {
      const matchSearch =
        c.sigla.toLowerCase().includes(search.toLowerCase()) ||
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.desc.toLowerCase().includes(search.toLowerCase())
      
      const matchTab = activeTab === 'Todas' || c.categoria === activeTab

      return matchSearch && matchTab
    })
  }, [search, activeTab])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 0 80px 0', color: 'var(--ink)', overflowX: 'clip' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 32px', boxSizing: 'border-box' }}>
        
        {/* Retorno e Título */}
        <div style={{ marginBottom: 40 }}>
          <Link href="/senado" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            color: 'var(--brand-2)',
            textDecoration: 'none',
            fontWeight: 700,
            marginBottom: 16
          }} className="hover-underline">
            ← Voltar para o Senado
          </Link>
          
          <div className="label" style={{ marginBottom: 8 }}>Órgãos Técnicos</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            Comissões Permanentes do Senado
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: 16, color: 'var(--ink-3)', maxWidth: 800, lineHeight: 1.5 }}>
            Aqui você encontra todas as 15 comissões permanentes do Senado Federal encarregadas de debater e avaliar as propostas temáticas e fiscalizar o Executivo. Clique em qualquer comissão para ver seus detalhes e projetos em andamento.
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
              placeholder="Buscar comissão por sigla ou nome (ex: CCJ, CAE, Meio Ambiente)..."
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
            gap: 24
          }}>
            {filtered.map((c, idx) => (
              <Link
                key={idx}
                href={`/senado/comissoes/${c.sigla.toLowerCase()}`}
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

                {c.presidente && (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--ink-3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--bg)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    marginTop: 4
                  }}>
                    <span>👤</span>
                    <span><strong>Presidente:</strong> {c.presidente}</span>
                  </div>
                )}

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
