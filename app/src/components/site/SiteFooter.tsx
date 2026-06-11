import Link from 'next/link'
import { isFeatureActive } from '@/lib/flags'

const COLUNAS = [
  {
    titulo: 'Exploração Federal',
    links: [
      { label: 'Buscar Políticos', href: '/busca' },
      { label: 'Câmara dos Deputados', href: '/camara' },
      { label: 'Senado Federal', href: '/senado' },
      { label: 'Projetos de Lei & Leis', href: '/projetos' },
      { label: 'Emendas Orçamento', href: '/emendas' },
      { label: 'Partidos Políticos', href: '/partidos' },
    ],
  },
  {
    titulo: 'Estados & Cidades',
    links: [
      { label: 'Todos os Estados', href: '/estado' },
      { label: 'Executivos Estaduais', href: '/estado/sp/executivo' },
      { label: 'Assembleias Legislativas', href: '/estado/sp/assembleia' },
      { label: 'Finanças das Cidades', href: '/cidades' },
      { label: 'Câmaras de Vereadores', href: '/estado/sp/sao-paulo-sp/camara' },
    ],
  },
  {
    titulo: 'Central Eleitoral',
    links: [
      { label: 'Central de Eleições', href: '/eleicao' },
      { label: 'Eleições 2026', href: '/eleicao/2026' },
      { label: 'Eleições 2024', href: '/eleicao/2024' },
      { label: 'Eleições 2022', href: '/eleicao/2022' },
      { label: 'Candidatos Presidenciais', href: '/eleicao/2026/presidente' },
    ],
  },
  {
    titulo: 'Transparência & Suporte',
    links: [
      { label: 'Metodologia', href: '/metodologia' },
      { label: 'Fontes de Dados', href: '/fontes' },
      { label: 'Como Funciona', href: '/como-funciona' },
      { label: 'Manifesto Cívico', href: '/manifesto' },
      { label: 'Glossário Político', href: '/glossario' },
      { label: 'Apoiar o Projeto', href: '/apoio' },
    ],
  },
  {
    titulo: 'Área Cidadã',
    links: [
      { label: 'Entrar', href: '/login' },
      { label: 'Criar conta', href: '/cadastro' },
      { label: 'Painel do Usuário', href: '/painel' },
      { label: 'Políticos Seguidos', href: '/meus-politicos' },
      { label: 'Comparar Políticos', href: '/comparar' },
    ],
  },
]

export async function SiteFooter() {
  const isCompararActive = await isFeatureActive('comparativo_parlamentares')
  const isInsightsActive = await isFeatureActive('insights_rankings')
  
  const colunas = COLUNAS.map(col => {
    if (col.titulo === 'Exploração Federal') {
      return {
        ...col,
        links: [
          ...col.links,
          ...(isInsightsActive ? [{ label: 'Rankings & Insights', href: '/insights' }] : [])
        ]
      }
    }
    if (col.titulo === 'Área Cidadã') {
      return {
        ...col,
        links: col.links.filter(link => link.href !== '/comparar' || isCompararActive)
      }
    }
    return col
  })

  return (
    <footer className="bg-[#1E293B] border-t border-[#334155] w-full mt-16 font-sans">
      {/* Faixa de Apoio Cívico */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#2D1B69] border-b border-[#334155] py-8 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h4 className="text-white font-bold text-base flex items-center gap-2 mb-1">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-[#FF8A00] flex-shrink-0"
                style={{ display: 'inline-block' }}
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              Este projeto é independente e vive do apoio da comunidade
            </h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-2xl">
              Sem paywall. Sem alinhamento partidário. Dados transparentes traduzidos em linguagem simples para empoderar o cidadão brasileiro.
            </p>
          </div>
          <Link
            href="/apoio"
            className="bg-[#FF8A00] hover:bg-[#FF981A] text-slate-900 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg shadow-md transition-colors whitespace-nowrap self-start md:self-auto"
          >
            Apoiar o projeto →
          </Link>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Coluna Logo e Apresentação */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group hover:opacity-95 transition-opacity">
              <svg
                viewBox="0 0 32 28"
                className="w-8 h-7 text-[#6366F1] fill-current drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="0" y="0" width="5.5" height="28" rx="1" />
                <path d="M5.5 0 L14.5 18 L14.5 28 L5.5 10 Z" />
                <rect x="16.5" y="16" width="4" height="12" rx="0.5" />
                <rect x="22.5" y="8" width="4" height="20" rx="0.5" />
                <rect x="28.5" y="0" width="3.5" height="28" rx="0.5" />
              </svg>
              <span className="font-extrabold text-white text-lg tracking-tight select-none">
                Meus <span className="font-semibold text-slate-300">Políticos</span>
              </span>
            </Link>
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm">
              Traduzindo a atividade governamental de forma simples, direta e visual. Informação pública acessível de verdade.
            </p>
          </div>

          {/* Colunas de Links */}
          {colunas.map((col) => (
            <div key={col.titulo} className="space-y-4">
              <h5 className="text-[#A78BFA] font-bold text-xs uppercase tracking-wider font-mono">
                {col.titulo}
              </h5>
              <ul className="space-y-2.5 text-xs">
                {col.links.map((link) => {
                  const isEntrar = link.label === 'Entrar'
                  return (
                    <li key={link.href} style={isEntrar ? { marginTop: 4, marginBottom: 4 } : undefined}>
                      <Link
                        href={link.href}
                        className={
                          isEntrar
                            ? 'inline-block text-center bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-[11px] px-3.5 py-1.5 rounded transition-all'
                            : 'text-[#94A3B8] hover:text-white transition-colors duration-150'
                        }
                        style={isEntrar ? { backgroundColor: '#8B5CF6', color: '#ffffff' } : undefined}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Divisor */}
        <div className="border-t border-[#334155]/60 mt-12 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Metadados Cívicos */}
          <div className="flex flex-col gap-1.5 text-[10px] md:text-[11px] text-[#64748B] font-mono leading-relaxed">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Dados Atualizados: Diariamente (Horário de Brasília)
            </span>
            <span>
              Fontes Oficiais: Dados Abertos Câmara dos Deputados v2.0 | Senado Federal API | Portal da Transparência | TSE
            </span>
          </div>

          {/* Copyright e Redes Sociais */}
          <div className="flex flex-col md:items-end gap-3 text-[11px] text-[#64748B] font-mono">
            {/* Ícones de Contato */}
            <div className="flex gap-2">
              {[
                {
                  href: 'https://x.com/meuspoliticos',
                  title: 'X / Twitter',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                },
                {
                  href: 'mailto:contato@meuspoliticos.com.br',
                  title: 'E-mail',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  title={s.title}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg border border-[#334155] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-slate-800 transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
            <div className="text-left md:text-right">
              © {new Date().getFullYear()} Meus Políticos. Transparência e cidadania ativa.
              {process.env.NEXT_PUBLIC_APP_VERSION && (
                <span className="opacity-50 ml-2">({process.env.NEXT_PUBLIC_APP_VERSION})</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
