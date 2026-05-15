'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

const dataAtualizacao = '13 de maio de 2026'

const secoes = [
  {
    id: 'aceitacao',
    numero: 1,
    titulo: 'Aceitação dos Termos',
    conteudo: [
      'Ao acessar, navegar, criar conta ou utilizar qualquer funcionalidade do Meus Políticos, o usuário declara ter lido, compreendido e concordado com estes Termos de Uso e com a Política de Privacidade da plataforma.',
      'Caso não concorde com qualquer disposição aqui prevista, o usuário deverá interromper imediatamente a utilização da plataforma.',
    ],
  },
  {
    id: 'finalidade',
    numero: 2,
    titulo: 'Finalidade da Plataforma',
    conteudo: [
      'O Meus Políticos possui caráter exclusivamente informativo, cívico e educacional.',
      'A plataforma foi criada para facilitar o acompanhamento de informações públicas, fortalecer mecanismos de transparência e incentivar o controle social democrático por meio da tecnologia e da organização de dados públicos.',
      'As informações disponibilizadas não constituem:',
      '• orientação jurídica;\n• consultoria eleitoral;\n• parecer político;\n• recomendação institucional;\n• manifestação partidária.',
      'Nenhum conteúdo deve ser interpretado como aconselhamento oficial ou substituição de fontes governamentais primárias.',
    ],
  },
  {
    id: 'neutralidade',
    numero: 3,
    titulo: 'Neutralidade Institucional',
    conteudo: [
      'O Meus Políticos mantém posição estritamente apartidária e independente.',
      'A plataforma:',
      '• não representa partidos políticos;\n• não apoia candidaturas;\n• não participa de campanhas eleitorais;\n• não realiza propaganda político-partidária;\n• não atua como órgão governamental.',
      'Nosso objetivo é promover acesso qualificado à informação pública de forma transparente, técnica e imparcial.',
    ],
  },
  {
    id: 'fontes',
    numero: 4,
    titulo: 'Fontes de Dados Públicos',
    conteudo: [
      'As informações exibidas podem ser obtidas por meio de:',
      '• APIs governamentais oficiais;\n• portais públicos de transparência;\n• bases de dados abertas;\n• diários oficiais;\n• serviços institucionais disponibilizados por órgãos públicos;\n• fontes públicas legítimas e auditáveis.',
      'Embora adotemos medidas técnicas para atualização e integridade dos dados, podem ocorrer:',
      '• atrasos de sincronização;\n• inconsistências de origem;\n• indisponibilidade temporária de fontes;\n• divergências entre bases públicas.',
      'Sempre que possível, o Meus Políticos preservará referências e vínculos com as fontes originais para garantir rastreabilidade e contexto informacional.',
    ],
  },
  {
    id: 'conta',
    numero: 5,
    titulo: 'Conta de Usuário e Autenticação',
    conteudo: [
      'O acesso a determinadas funcionalidades poderá exigir autenticação por:',
      '• Google OAuth;\n• login via X (Twitter);\n• e-mail e senha;\n• outros métodos disponibilizados futuramente.',
      'O usuário compromete-se a:',
      '• fornecer informações verdadeiras;\n• manter suas credenciais protegidas;\n• não compartilhar acesso indevidamente;\n• utilizar a plataforma de forma lícita e responsável.',
      'O usuário é integralmente responsável pelas atividades realizadas em sua conta.',
    ],
  },
  {
    id: 'uso-aceitavel',
    numero: 6,
    titulo: 'Uso Aceitável da Plataforma',
    conteudo: [
      'É proibido utilizar o Meus Políticos para:',
      '• disseminação de desinformação;\n• atividades fraudulentas;\n• automação abusiva;\n• coleta massiva não autorizada de dados;\n• engenharia reversa maliciosa;\n• ataques de segurança;\n• tentativa de interrupção da plataforma;\n• violação de direitos de terceiros;\n• utilização incompatível com a legislação brasileira.',
      'Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, bem como adotar medidas técnicas, administrativas e jurídicas cabíveis.',
    ],
  },
  {
    id: 'privacidade',
    numero: 7,
    titulo: 'Privacidade, Cookies e Analytics',
    conteudo: [
      'O Meus Políticos pode utilizar:',
      '• cookies;\n• armazenamento local;\n• ferramentas de analytics;\n• serviços de autenticação;\n• métricas de uso e segurança.',
      'Esses recursos são utilizados exclusivamente para:',
      '• autenticação de usuários;\n• segurança da plataforma;\n• melhoria da experiência;\n• estabilidade operacional;\n• análises estatísticas agregadas.',
      'O tratamento de dados pessoais segue a Lei Geral de Proteção de Dados (LGPD) e as diretrizes descritas em nossa Política de Privacidade.',
      'O Meus Políticos não comercializa dados pessoais de usuários.',
    ],
  },
  {
    id: 'propriedade',
    numero: 8,
    titulo: 'Propriedade Intelectual',
    conteudo: [
      'A identidade visual, estrutura da plataforma, elementos gráficos, interfaces, arquitetura de navegação, textos institucionais e demais componentes proprietários do Meus Políticos são protegidos pela legislação aplicável de propriedade intelectual.',
      'Dados públicos provenientes de órgãos governamentais permanecem vinculados às respectivas licenças, normas e políticas das fontes originais.',
      'É permitido o uso legítimo de informações públicas disponibilizadas pela plataforma para fins:',
      '• acadêmicos;\n• jornalísticos;\n• educativos;\n• cívicos;\n• informativos;',
      'desde que respeitados:',
      '• atribuição adequada;\n• integridade contextual;\n• legislação vigente.',
    ],
  },
  {
    id: 'limitacao',
    numero: 9,
    titulo: 'Limitação de Responsabilidade',
    conteudo: [
      'Embora adotemos esforços razoáveis para garantir disponibilidade, segurança e confiabilidade, o Meus Políticos não garante:',
      '• funcionamento ininterrupto;\n• ausência total de falhas;\n• atualização em tempo real;\n• completude absoluta dos dados públicos.',
      'A plataforma não se responsabiliza por:',
      '• decisões tomadas exclusivamente com base nas informações disponibilizadas;\n• indisponibilidade de APIs externas;\n• falhas de terceiros;\n• eventos fora de controle razoável;\n• alterações realizadas por órgãos públicos nas fontes originais.',
      'O usuário reconhece que dados governamentais podem sofrer alterações sem aviso prévio pelas instituições responsáveis.',
    ],
  },
  {
    id: 'alteracoes',
    numero: 10,
    titulo: 'Alterações destes Termos',
    conteudo: [
      'Os presentes Termos de Uso poderão ser modificados periodicamente para refletir:',
      '• mudanças legais;\n• requisitos regulatórios;\n• atualizações técnicas;\n• evolução das funcionalidades da plataforma.',
      'A versão mais recente estará sempre disponível nesta página, acompanhada da respectiva data de atualização.',
    ],
  },
  {
    id: 'contato',
    numero: 11,
    titulo: 'Contato',
    conteudo: [
      'Para dúvidas, solicitações institucionais ou assuntos relacionados a estes Termos de Uso, entre em contato:',
      'contato@meuspoliticos.com.br',
    ],
  },
]

function TableOfContents({ activeSection }: { activeSection: string }) {
  return (
    <nav
      className="sticky top-[80px] max-h-[calc(100vh-5rem)] space-y-1 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm"
      aria-label="Navegação da página"
    >
      <h3 className="mono px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--mute)]">Sumário</h3>
      <ul className="space-y-0.5">
        {secoes.map((secao) => (
          <li key={secao.id}>
            <a
              href={`#${secao.id}`}
              className={`mono block py-2 text-[11px] uppercase tracking-[0.12em] transition ${
                activeSection === secao.id
                  ? 'border-l-2 border-l-[var(--brand-2)] bg-[var(--brand-soft)] pl-2 font-semibold text-[var(--brand-2)]'
                  : 'pl-3 text-[var(--ink-3)] hover:bg-[var(--bg)] hover:text-[var(--ink)]'
              }`}
            >
              {secao.numero}. {secao.titulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)

      // Detectar seção ativa
      const sections = secoes.map((s) => document.getElementById(s.id)).filter(Boolean)
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        if (section) {
          const { offsetTop, offsetHeight } = section
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-[var(--bg)] to-[var(--panel)]">
      {/* Hero Section */}
      <section className="border-b border-[var(--line)] bg-linear-to-b from-slate-900 via-[var(--brand)] to-slate-800">
        <div className="container-shell py-16 sm:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/50 px-3 py-1 backdrop-blur-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Política Institucional</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">Termos de Uso</h1>
              <p className="text-lg text-slate-300 sm:text-xl">
                Transparência pública, responsabilidade digital e acesso democrático à informação.
              </p>
            </div>

            <p className="text-sm text-slate-400">
              O Meus Políticos é uma plataforma brasileira de transparência cívica desenvolvida para ampliar o acesso da população a informações públicas sobre agentes políticos, instituições e atividades governamentais, sempre com compromisso de neutralidade institucional, integridade dos dados e responsabilidade democrática.
            </p>

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 rounded-lg bg-slate-700/50 px-3 py-2 backdrop-blur-sm">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-slate-300">Última atualização: {dataAtualizacao}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-shell py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-4 lg:gap-12">
          {/* Table of Contents - Desktop Only */}
          <aside className="hidden lg:block">
            <TableOfContents activeSection={activeSection} />
          </aside>

          {/* Content */}
          <article className="space-y-8 lg:col-span-3">
            {secoes.map((secao, index) => (
              <section
                key={secao.id}
                id={secao.id}
                className="scroll-mt-20 animate-in fade-in duration-500"
              >
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm transition hover:shadow-md sm:p-8">
                  {/* Section Header */}
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)] font-semibold text-[var(--brand-2)]">
                      {secao.numero}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-[var(--ink)]">{secao.titulo}</h2>
                    </div>
                  </div>

                  {/* Section Content */}
                  <div className="space-y-4 text-[var(--ink-3)]">
                    {secao.conteudo.map((paragrafo, idx) => {
                      // Handle contact email
                      if (paragrafo === 'contato@meuspoliticos.com.br') {
                        return (
                          <p key={idx} className="text-base leading-relaxed">
                            <a
                              href="mailto:contato@meuspoliticos.com.br"
                              className="font-semibold text-[var(--brand-2)] hover:underline"
                            >
                              contato@meuspoliticos.com.br
                            </a>
                          </p>
                        )
                      }

                      // Handle bullet lists
                      if (paragrafo.startsWith('•')) {
                        return (
                          <div key={idx} className="space-y-2 pl-4">
                            {paragrafo.split('\n').map((item, itemIdx) => (
                              <p key={itemIdx} className="flex gap-3 text-base leading-relaxed">
                                <span className="text-slate-400">•</span>
                                <span>{item.replace('• ', '')}</span>
                              </p>
                            ))}
                          </div>
                        )
                      }

                      // Regular paragraphs
                      return (
                        <p key={idx} className="text-base leading-relaxed">
                          {paragrafo}
                        </p>
                      )
                    })}
                  </div>

                  {/* Divider */}
                  {index < secoes.length - 1 && <div className="mt-6 border-t border-[var(--line)]" />}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>

      {/* Footer Navigation */}
      <section className="border-t border-[var(--line)] bg-[var(--bg)]">
        <div className="container-shell py-8 sm:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 font-medium text-[var(--ink-3)] transition hover:border-[var(--line-strong)] hover:bg-[var(--bg)]"
            >
              <svg className="h-4 w-4 transition group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para a página inicial
            </Link>

            <Link
              href="/privacidade"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--brand-soft)] px-4 py-2.5 font-medium text-[var(--brand-2)] transition hover:brightness-95"
            >
              Política de Privacidade
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] shadow-lg transition hover:bg-[var(--bg)] lg:bottom-8 lg:right-8"
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="h-5 w-5 text-[var(--ink-3)]" />
        </button>
      )}
    </main>
  )
}
