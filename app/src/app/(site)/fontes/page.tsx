import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Building2, CheckCircle2, Database, FileSearch, Globe2, MapPin, RefreshCw, ShieldCheck, Timer, Newspaper, Lock, AlertTriangle, Users } from "lucide-react"
import { StatusDot } from "@/components/civic"

export const metadata: Metadata = {
  title: "Fontes de dados",
  description: "De onde vêm os dados exibidos no Meus Políticos: rastreabilidade e transparência.",
}

const fontesAtivas = [
  {
    nome: "Câmara dos Deputados",
    icone: Building2,
    fornece: ["Votações", "gastos CEAP", "presenças", "discursos", "projetos de lei"],
    url: "https://dadosabertos.camara.leg.br",
    frequencia: "Diária",
    status: "ATIVO",
    tone: "pos" as const,
  },
  {
    nome: "TSE",
    icone: ShieldCheck,
    fornece: ["Candidaturas", "bens declarados", "financiamento de campanha"],
    url: "https://dadosabertos.tse.jus.br",
    frequencia: "Por eleição",
    status: "ATIVO",
    tone: "pos" as const,
  },
  {
    nome: "Portal da Transparência",
    icone: Globe2,
    fornece: ["Emendas parlamentares", "transferências", "viagens"],
    url: "https://portaldatransparencia.gov.br",
    frequencia: "Diária",
    status: "ATIVO",
    tone: "pos" as const,
  },
  {
    nome: "IBGE",
    icone: MapPin,
    fornece: ["Municípios", "estados", "códigos geográficos"],
    url: "https://servicodados.ibge.gov.br",
    frequencia: "Anual",
    status: "ATIVO",
    tone: "pos" as const,
  },
  {
    nome: "ViaCEP",
    icone: FileSearch,
    fornece: ["Consulta de CEP — 'Quem me representa'"],
    url: "https://viacep.com.br",
    frequencia: "Tempo real",
    status: "ATIVO",
    tone: "pos" as const,
  },
]

const fontesFuturas = [
  {
    nome: "Senado Federal",
    icone: Users,
    fornece: ["Votações", "discursos", "comissões dos senadores"],
    status: "EM BREVE",
    tone: "warn" as const,
  },
  {
    nome: "Diário Oficial da União",
    icone: Newspaper,
    fornece: ["Decretos", "nomeações", "exonerações"],
    status: "EM BREVE",
    tone: "warn" as const,
  },
  {
    nome: "SIOP",
    icone: Database,
    fornece: ["Plano Plurianual — promessas vs execução do governo federal"],
    status: "FASE 2",
    tone: "mute" as const,
  },
  {
    nome: "Agência Brasil (EBC)",
    icone: BookOpen,
    fornece: ["Notícias oficiais — seção 'Na imprensa'"],
    status: "FASE 2",
    tone: "mute" as const,
  },
]

export default function FontesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#eef3ff] to-transparent" />
        <div className="pointer-events-none absolute right-[-8rem] top-12 h-72 w-72 rounded-full bg-[color:var(--brand-2)]/8 blur-3xl" />
        <div className="container-shell relative py-14 sm:py-20">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 shadow-sm">
              <span className="inline-block size-2 rounded-full bg-[var(--brand-2)]" />
              <span className="mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mute)]">Fontes de dados</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">De onde vêm os dados</h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--ink-3)] sm:text-lg">
              Todos os dados exibidos no Meus Políticos são coletados diretamente de fontes oficiais do governo brasileiro. Nenhum dado é inventado, estimado ou proveniente de fontes não oficiais. Cada informação tem um link rastreável até sua origem.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/metodologia" className="font-semibold text-[var(--brand-2)] hover:underline">Ver metodologia</Link>
              <span className="text-slate-400">·</span>
              <Link href="/como-funciona" className="font-semibold text-[var(--brand-2)] hover:underline">Como funciona</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FONTES ATIVAS */}
      <section className="container-shell py-10">
        <h2 className="mb-6 text-xl font-bold text-[var(--ink)]">Fontes do MVP (ativas agora)</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fontesAtivas.map((fonte) => (
            <div key={fonte.nome} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <fonte.icone size={24} className="text-[var(--brand-2)]" />
                <span className="font-bold text-[var(--ink)]">{fonte.nome}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2">
                <span className="mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">Status</span>
                <span className="mono inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
                  <StatusDot tone={fonte.tone} />
                  {fonte.status}
                </span>
              </div>
              <ul className="mb-1 ml-1 list-disc text-xs text-[var(--ink-3)]">
                {fonte.fornece.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-xs">
                <a href={fonte.url} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-2)] hover:underline">Acessar fonte oficial</a>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{fonte.frequencia}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FONTES FUTURAS */}
      <section className="container-shell py-8">
        <h2 className="mb-4 text-xl font-bold text-[var(--ink)]">Fontes em breve (Fase 2)</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {fontesFuturas.map((fonte) => (
            <div key={fonte.nome} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)]/60 p-5 shadow-sm flex flex-col gap-2 opacity-60">
              <div className="flex items-center gap-2 mb-1">
                <fonte.icone size={22} className="text-[var(--brand-2)]" />
                <span className="font-bold text-[var(--ink)]">{fonte.nome}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2">
                <span className="mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">Status</span>
                <span className="mono inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
                  <StatusDot tone={fonte.tone} />
                  {fonte.status}
                </span>
              </div>
              <ul className="mb-1 ml-1 list-disc text-xs text-[var(--ink-3)]">
                {fonte.fornece.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* COMO VERIFICAR UM DADO */}
      <section className="container-shell py-8">
        <div className="rounded-2xl bg-[#1e2a47] p-6 text-white shadow-md">
          <h2 className="mb-2 text-lg font-bold">Como verificar um dado</h2>
          <ol className="mb-2 list-decimal pl-5 text-sm space-y-1">
            <li>Cada dado exibido tem um link para a fonte original — clique no ícone de fonte ao lado do número</li>
            <li>Se encontrar divergência entre o que exibimos e a fonte oficial, a fonte oficial prevalece sempre</li>
            <li>Erros podem ser reportados em <a href="mailto:contato@meuspoliticos.com.br" className="underline">contato@meuspoliticos.com.br</a> — corrigimos com transparência</li>
          </ol>
        </div>
      </section>

      {/* O QUE NÃO USAMOS */}
      <section className="container-shell py-8">
        <div className="rounded-2xl border-l-4 border-yellow-400 bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-yellow-500" />
            <span className="font-semibold text-yellow-700">O que não usamos</span>
          </div>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            <li>Não usamos scraping de sites de notícias como fonte primária</li>
            <li>Não usamos dados de redes sociais como fonte de fatos</li>
            <li>Não usamos estimativas ou projeções — apenas dados registrados oficialmente</li>
            <li>Não editamos, selecionamos ou filtramos dados por critério editorial</li>
          </ul>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="container-shell pb-10 pt-4">
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
          A coleta é automatizada via scripts Python que rodam diariamente. Eventuais atrasos de até 24h podem ocorrer. O horário da última atualização de cada dado é exibido no perfil do político.
        </p>
        <nav className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/manifesto" className="font-semibold text-[var(--brand-2)] hover:underline">Manifesto</Link>
          <Link href="/sobre" className="font-semibold text-[var(--brand-2)] hover:underline">Sobre</Link>
          <Link href="/como-funciona" className="font-semibold text-[var(--brand-2)] hover:underline">Como funciona</Link>
          <Link href="/metodologia" className="font-semibold text-[var(--brand-2)] hover:underline">Metodologia</Link>
        </nav>
      </section>
    </main>
  )
}
