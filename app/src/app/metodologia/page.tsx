import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, BookOpen, Calculator, CheckCircle2, FileText, FlaskConical, Info, ListChecks, Lock, Scale, ShieldCheck, Users, Wrench } from "lucide-react"

export const metadata: Metadata = {
  title: "Metodologia",
  description: "Como calculamos os dados: metodologia científica dos scores do Meus Políticos.",
}

const scores = [
  {
    number: 1,
    name: "Presença",
    base: "NDI Parliamentary Monitoring Guidelines",
    authors: "NDI (2016)",
    formula: "[(P_ord × 1.0) + (P_extra × 1.2) + (P_com × 0.8) + (P_sol × 0.2)] ÷ Total Ponderado",
    description: "Mede a presença do parlamentar em sessões ordinárias, extraordinárias, comissões e eventos solenes, ponderando cada tipo de participação.",
    leitura: "Presença 12% acima da média de deputados de SP",
    limitacao: "Ausências em missões diplomáticas ou lideranças de partido podem ser legítimas e são excluídas do cálculo quando registradas oficialmente.",
  },
  {
    number: 2,
    name: "Atividade Legislativa (LES)",
    base: "Legislative Effectiveness Score — Volden & Wiseman (Cambridge, 2014)",
    authors: "Volden & Wiseman (2014)",
    formula: "Ponderação por estágio (1→7) × tipo (1, 5, 10) ÷ média da legislatura",
    description: "Avalia a efetividade legislativa considerando o avanço e o tipo dos projetos apresentados pelo parlamentar.",
    leitura: "3 projetos sancionados — 2.3× a média da legislatura",
    limitacao: "Favorece parlamentares da base governista, que têm mais facilidade de aprovação. Exibimos junto com dado de bancada para contextualizar.",
  },
  {
    number: 3,
    name: "Transparência",
    base: "AID (Banco Mundial) + Financial Disclosure Index (OCDE)",
    authors: "World Bank (2012), OCDE",
    formula: "(prazo × 0.30) + (completude × 0.30) + (sem pendências × 0.20) + (agenda pública × 0.20)",
    description: "Verifica se o parlamentar entrega declarações no prazo, preenche todos os campos obrigatórios, não possui pendências e publica agenda de gabinete.",
    leitura: "Checklist visual dos 4 critérios",
    limitacao: "Qualidade do preenchimento no TSE pode ser baixa por erro técnico, não necessariamente má-fé.",
  },
  {
    number: 4,
    name: "Coerência Partidária (Agreement Index)",
    base: "Agreement Index — Hix, Noury & Roland · VoteWatch Europa, TheyWorkForYou (UK)",
    authors: "Hix, Noury & Roland (2007)",
    formula: "[max(y,n,a) - 0.5 × (Σ - max)] ÷ Σ",
    description: "Mede o quanto o parlamentar vota de acordo com a maioria do seu partido nas votações nominais.",
    leitura: "Vota com o partido em 87% das votações nominais — média do partido: 82%",
    limitacao: "Alta coesão pode ser disciplina imposta por líderes — não necessariamente convergência real de preferências.",
  },
  {
    number: 5,
    name: "Eficiência de Gastos CEAP",
    base: "Normalização regional — Ranking dos Políticos (BR) + tetos oficiais da Câmara por UF",
    authors: "DIAP (2023), Câmara dos Deputados",
    formula: "100 × (1 - Gasto_Real ÷ Média_Regional_UF)",
    description: "Compara o gasto do parlamentar com a média dos deputados do mesmo estado, normalizando por UF.",
    leitura: "Gastou R$ 38.000 — 12% abaixo da média de deputados do Amazonas",
    limitacao: "Gastar pouco não é sempre positivo — pode indicar mandato inativo. Cruzamos com Score de Atividade.",
  },
]

const referencias = [
  {
    texto: "Volden, C. & Wiseman, A. (2014). Legislative Effectiveness in the United States Congress. Cambridge University Press.",
  },
  {
    texto: "Hix, S., Noury, A. & Roland, G. (2007). Democratic Politics in the European Parliament. Cambridge University Press.",
  },
  {
    texto: "World Bank (2012). Public Officials Financial Disclosure: A Tool to Prevent Corruption.",
  },
  {
    texto: "NDI (2016). Strengthening Parliamentary Accountability, Citizen Engagement and Access to Information.",
  },
  {
    texto: "DIAP (2023). Quem Foi Quem — Metodologia. Brasília.",
  },
]

export default function MetodologiaPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#eef3ff] to-transparent" />
        <div className="pointer-events-none absolute right-[-8rem] top-12 h-72 w-72 rounded-full bg-[#2952cc]/8 blur-3xl" />
        <div className="container-shell relative py-14 sm:py-20">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
              <span className="inline-block size-2 rounded-full bg-[#2952cc]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Metodologia científica</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">Como calculamos os dados</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Não inventamos métricas. Adaptamos metodologias validadas academicamente e usadas por universidades, parlamentos e organismos internacionais. Cada score é auditável, replicável e baseado exclusivamente em dados oficiais.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/fontes" className="font-semibold text-[#2952cc] hover:underline">Ver fontes</Link>
              <span className="text-slate-400">·</span>
              <a href="https://github.com/meuspoliticos" target="_blank" rel="noopener" className="font-semibold text-[#2952cc] hover:underline">Repositório público</a>
            </div>
          </div>
        </div>
      </section>

      {/* PRINCÍPIO FUNDAMENTAL */}
      <section className="container-shell py-10">
        <div className="mb-8 rounded-2xl bg-[#1e2a47] p-6 text-white shadow-md">
          <h2 className="mb-2 text-lg font-bold">Instrumento de auditoria cívica — não ranking de opinião</h2>
          <p className="mb-4 text-base">Todos os scores são benchmarks relativos. O político é comparado com peers do mesmo perfil — partido, estado e tempo de mandato. Nunca uma nota absoluta de bom ou mau. A conclusão é sempre do cidadão.</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-[#223366] px-3 py-1 text-xs font-semibold"><ShieldCheck size={16} />Dados de fontes oficiais</div>
            <div className="flex items-center gap-2 rounded-lg bg-[#223366] px-3 py-1 text-xs font-semibold"><FileText size={16} />Fórmulas públicas e auditáveis</div>
            <div className="flex items-center gap-2 rounded-lg bg-[#223366] px-3 py-1 text-xs font-semibold"><BookOpen size={16} />Qualquer pesquisador pode replicar</div>
          </div>
        </div>
      </section>

      {/* SCORES */}
      <section className="container-shell py-8">
        <h2 className="mb-6 text-xl font-bold text-slate-900">Os 5 scores</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {scores.map((score) => (
            <div key={score.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef3ff] text-[#2952cc] font-bold text-sm">{score.number}</span>
                <span className="font-semibold text-slate-700">{score.name}</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded bg-[#e0e7ff] px-2 py-0.5 text-xs font-medium text-[#2952cc]">Base científica</span>
              </div>
              <div className="text-xs text-slate-500 mb-1">{score.base} <span className="text-slate-400">·</span> <span>{score.authors}</span></div>
              <div className="text-base font-medium text-slate-900">{score.description}</div>
              <div className="rounded bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-mono text-slate-700 whitespace-pre-wrap">{score.formula}</div>
              <div className="mt-2 text-sm">
                <span className="font-semibold text-[#2952cc]">Como lemos esse dado:</span> {score.leitura}
              </div>
              <div className="mt-1 rounded bg-yellow-50 border-l-4 border-yellow-400 px-3 py-2 text-xs text-yellow-800">
                <span className="font-semibold">Limitação conhecida:</span> {score.limitacao}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REFERÊNCIAS */}
      <section className="container-shell py-8">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Referências científicas</h2>
        <ul className="list-disc pl-6 space-y-1 text-slate-700">
          {referencias.map((ref, i) => (
            <li key={i}>{ref.texto}</li>
          ))}
        </ul>
      </section>

      {/* TRANSPARÊNCIA */}
      <section className="container-shell py-8">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Transparência da metodologia</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-start gap-2">
            <Wrench size={24} className="text-[#2952cc]" />
            <span className="font-semibold">Código aberto</span>
            <span className="text-xs text-slate-500">Fórmulas disponíveis no GitHub</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-start gap-2">
            <ListChecks size={24} className="text-[#2952cc]" />
            <span className="font-semibold">Memória de cálculo</span>
            <span className="text-xs text-slate-500">Cada score auditável por parlamentar</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-start gap-2">
            <Calculator size={24} className="text-[#2952cc]" />
            <span className="font-semibold">Você ajusta os pesos</span>
            <span className="text-xs text-slate-500">Em breve, o cidadão poderá personalizar a ponderação</span>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="container-shell pb-10 pt-4">
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
          Scores calculados com base em dados oficiais da Câmara dos Deputados, Senado Federal e TSE. Esta análise estatística não constitui julgamento moral ou profissional. Erros podem ser reportados em <a href="mailto:contato@meuspoliticos.com.br" className="underline">contato@meuspoliticos.com.br</a>.
        </p>
        <nav className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/manifesto" className="font-semibold text-[#2952cc] hover:underline">Manifesto</Link>
          <Link href="/sobre" className="font-semibold text-[#2952cc] hover:underline">Sobre</Link>
          <Link href="/como-funciona" className="font-semibold text-[#2952cc] hover:underline">Como funciona</Link>
          <Link href="/fontes" className="font-semibold text-[#2952cc] hover:underline">Fontes</Link>
        </nav>
      </section>
    </main>
  )
}
