'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

const dataAtualizacao = '13 de maio de 2026'

const secoes = [
  {
    id: 'quem-somos',
    numero: 1,
    titulo: 'Quem Somos',
    conteudo: [
      'O Meus Políticos é uma plataforma independente voltada à organização, monitoramento e disponibilização de informações públicas relacionadas ao ambiente político e institucional brasileiro.',
      'Nosso objetivo é fortalecer:',
      '• a transparência pública;\n• o acesso democrático à informação;\n• o controle social;\n• a compreensão cidadã de dados governamentais.',
      'A plataforma atua de forma neutra, apartidária e sem vínculo com partidos políticos, candidaturas ou órgãos governamentais.',
    ],
  },
  {
    id: 'dados-coletados',
    numero: 2,
    titulo: 'Dados Coletados',
    conteudo: [
      'Podemos coletar informações fornecidas diretamente pelo usuário durante:',
      '• criação de conta;\n• autenticação;\n• navegação;\n• interação com funcionalidades da plataforma.',
      'Os dados coletados podem incluir:',
      '• nome;\n• endereço de e-mail;\n• identificadores de autenticação;\n• imagem de perfil (quando disponibilizada pelo provedor de login);\n• registros técnicos de acesso;\n• informações de sessão;\n• preferências de uso;\n• dados básicos de dispositivo e navegador.',
      'Também podem ser gerados logs técnicos e métricas operacionais necessários para segurança, estabilidade e melhoria contínua da plataforma.',
      'O Meus Políticos não comercializa dados pessoais e não utiliza informações pessoais para publicidade política direcionada.',
    ],
  },
  {
    id: 'autenticacao',
    numero: 3,
    titulo: 'Login e Autenticação',
    conteudo: [
      'O acesso à plataforma pode ocorrer por meio de:',
      '• Google OAuth;\n• login via X (Twitter);\n• autenticação por e-mail e senha;\n• outros métodos que venham a ser disponibilizados futuramente.',
      'Os processos de autenticação utilizam serviços especializados de infraestrutura, incluindo Supabase Authentication, com mecanismos de segurança para:',
      '• gerenciamento de sessão;\n• emissão de tokens;\n• validação de acesso;\n• proteção contra acessos indevidos.',
      'O usuário é responsável por manter a confidencialidade de suas credenciais e comunicar imediatamente qualquer uso suspeito ou não autorizado de sua conta.',
    ],
  },
  {
    id: 'cookies',
    numero: 4,
    titulo: 'Cookies e Tecnologias Semelhantes',
    conteudo: [
      'Utilizamos cookies e tecnologias similares para:',
      '• manter sessões autenticadas;\n• melhorar desempenho;\n• garantir funcionamento adequado da plataforma;\n• personalizar experiência de navegação;\n• analisar métricas de uso e estabilidade.',
      'Os cookies podem incluir:',
      '• cookies estritamente necessários;\n• cookies de segurança;\n• cookies de autenticação;\n• cookies analíticos e estatísticos.',
      'O usuário pode gerenciar ou bloquear cookies diretamente em seu navegador, ciente de que determinadas funcionalidades poderão ser afetadas.',
    ],
  },
  {
    id: 'analytics',
    numero: 5,
    titulo: 'Analytics e Métricas Operacionais',
    conteudo: [
      'Podemos utilizar ferramentas de analytics e monitoramento para compreender:',
      '• estabilidade da aplicação;\n• desempenho técnico;\n• usabilidade;\n• comportamento agregado de navegação;\n• evolução do produto.',
      'Sempre que possível, adotamos princípios de:',
      '• minimização de dados;\n• anonimização;\n• agregação estatística;\n• redução de identificação individual.',
      'As informações coletadas são utilizadas exclusivamente para melhoria da plataforma e segurança operacional.',
    ],
  },
  {
    id: 'dados-publicos',
    numero: 6,
    titulo: 'Dados Públicos e Fontes Governamentais',
    conteudo: [
      'O Meus Políticos pode exibir informações provenientes de:',
      '• APIs governamentais oficiais;\n• portais de transparência;\n• bases públicas abertas;\n• diários oficiais;\n• fontes institucionais legítimas.',
      'Esses dados possuem natureza pública e são organizados para facilitar:',
      '• pesquisa;\n• acompanhamento;\n• contextualização;\n• compreensão cidadã.',
      'A plataforma não altera a natureza pública dessas informações e busca preservar referências de origem sempre que possível.',
      'O tratamento e organização dos dados não representam apoio político, recomendação eleitoral ou posicionamento partidário.',
    ],
  },
  {
    id: 'finalidades-lgpd',
    numero: 7,
    titulo: 'Finalidades e Bases Legais (LGPD)',
    conteudo: [
      'O tratamento de dados pessoais ocorre para finalidades legítimas relacionadas à operação da plataforma, incluindo:',
      '• autenticação e gerenciamento de contas;\n• segurança da informação;\n• prevenção a fraudes;\n• funcionamento técnico da plataforma;\n• comunicação institucional;\n• melhoria contínua de funcionalidades;\n• cumprimento de obrigações legais e regulatórias.',
      'As bases legais aplicáveis podem incluir:',
      '• execução de contrato;\n• cumprimento de obrigação legal;\n• legítimo interesse;\n• exercício regular de direitos;\n• consentimento, quando necessário.',
      'Adotamos os princípios previstos pela LGPD, incluindo:',
      '• finalidade;\n• adequação;\n• necessidade;\n• transparência;\n• segurança;\n• prevenção;\n• responsabilização.',
    ],
  },
  {
    id: 'compartilhamento',
    numero: 8,
    titulo: 'Compartilhamento e Retenção de Dados',
    conteudo: [
      'O Meus Políticos não vende dados pessoais de usuários.',
      'Dados poderão ser compartilhados apenas com prestadores de serviço e operadores essenciais à operação da plataforma, tais como:',
      '• serviços de autenticação;\n• hospedagem e infraestrutura;\n• monitoramento técnico;\n• segurança;\n• analytics.',
      'Esses compartilhamentos ocorrem sob medidas razoáveis de proteção técnica e contratual.',
      'Os dados são armazenados somente pelo período necessário ao cumprimento:',
      '• das finalidades descritas nesta política;\n• de obrigações legais;\n• de requisitos regulatórios;\n• de necessidades legítimas de segurança e operação.',
    ],
  },
  {
    id: 'seguranca',
    numero: 9,
    titulo: 'Segurança da Informação',
    conteudo: [
      'Empregamos medidas técnicas e organizacionais razoáveis para proteger dados pessoais contra:',
      '• acessos não autorizados;\n• destruição;\n• perda;\n• alteração;\n• divulgação indevida;\n• incidentes de segurança.',
      'Apesar dos esforços contínuos de proteção, nenhum ambiente digital é completamente imune a riscos.',
      'O usuário reconhece os riscos inerentes ao uso da internet e compromete-se a utilizar a plataforma de maneira segura e responsável.',
    ],
  },
  {
    id: 'direitos',
    numero: 10,
    titulo: 'Direitos do Titular de Dados',
    conteudo: [
      'Nos termos da LGPD, o titular dos dados poderá solicitar:',
      '• confirmação da existência de tratamento;\n• acesso aos dados;\n• correção de informações incompletas ou desatualizadas;\n• anonimização, bloqueio ou eliminação quando aplicável;\n• portabilidade;\n• informações sobre compartilhamento;\n• revisão de decisões automatizadas, quando existente.',
      'As solicitações poderão ser realizadas por meio dos canais oficiais de contato informados nesta política.',
    ],
  },
  {
    id: 'alteracoes',
    numero: 11,
    titulo: 'Alterações desta Política',
    conteudo: [
      'Esta Política de Privacidade poderá ser atualizada periodicamente para refletir:',
      '• evolução da plataforma;\n• mudanças regulatórias;\n• melhorias técnicas;\n• alterações operacionais;\n• adequações legais.',
      'A versão vigente estará sempre disponível nesta página com sua respectiva data de atualização.',
    ],
  },
  {
    id: 'contato',
    numero: 12,
    titulo: 'Contato',
    conteudo: [
      'Para dúvidas, solicitações relacionadas à privacidade ou exercício de direitos previstos na LGPD, entre em contato:',
      'contato@meuspoliticos.com.br',
    ],
  },
]

function TableOfContents({ activeSection }: { activeSection: string }) {
  return (
    <nav
      className="sticky top-4 max-h-[calc(100vh-2rem)] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Navegação da página"
    >
      <h3 className="px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Sumário</h3>
      <ul className="space-y-1">
        {secoes.map((secao) => (
          <li key={secao.id}>
            <a
              href={`#${secao.id}`}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                activeSection === secao.id
                  ? 'bg-[#eef3ff] font-medium text-[#2952cc]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

export default function PrivacyPage() {
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
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-linear-to-b from-slate-900 via-[#1a2f5a] to-slate-800">
        <div className="container-shell py-16 sm:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/50 px-3 py-1 backdrop-blur-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">Política Institucional</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">Política de Privacidade</h1>
              <p className="text-lg text-slate-300 sm:text-xl">
                Transparência, proteção de dados e respeito à sua privacidade.
              </p>
            </div>

            <p className="text-sm text-slate-400">
              O Meus Políticos é uma plataforma brasileira de transparência pública e monitoramento cívico criada para ampliar o acesso da sociedade a informações políticas de interesse público de forma organizada, acessível e tecnologicamente responsável.
            </p>

            <p className="text-sm text-slate-400">
              Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos dados pessoais de usuários da plataforma, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
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
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-8">
                  {/* Section Header */}
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef3ff] font-semibold text-[#2952cc]">
                      {secao.numero}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-900">{secao.titulo}</h2>
                    </div>
                  </div>

                  {/* Section Content */}
                  <div className="space-y-4 text-slate-700">
                    {secao.conteudo.map((paragrafo, idx) => {
                      // Handle contact email
                      if (paragrafo === 'contato@meuspoliticos.com.br') {
                        return (
                          <p key={idx} className="text-base leading-relaxed">
                            <a
                              href="mailto:contato@meuspoliticos.com.br"
                              className="font-semibold text-[#2952cc] hover:underline"
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
                  {index < secoes.length - 1 && <div className="mt-6 border-t border-slate-200" />}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>

      {/* Footer Navigation */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="container-shell py-8 sm:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <svg className="h-4 w-4 transition group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para a página inicial
            </Link>

            <Link
              href="/termos"
              className="inline-flex items-center gap-2 rounded-lg border border-[#dbe4ff] bg-[#eef3ff] px-4 py-2.5 font-medium text-[#2952cc] transition hover:bg-[#e3ebff]"
            >
              Ver Termos de Uso
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
          className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white shadow-lg transition hover:bg-slate-50 lg:bottom-8 lg:right-8"
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="h-5 w-5 text-slate-700" />
        </button>
      )}
    </main>
  )
}
