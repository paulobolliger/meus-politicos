import Link from 'next/link'
import { MapPinned } from 'lucide-react'

type Regiao = {
  nome: string
  destaque: string
  siglas: string[]
  cor: string
  texto: string
  posicao: string
}

const regioes: Regiao[] = [
  {
    nome: 'Norte',
    destaque: 'Clareza territorial',
    siglas: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
    cor: '#59c38c',
    texto: '#0f5132',
    posicao: 'left-[13%] top-[13%] w-[34%]',
  },
  {
    nome: 'Nordeste',
    destaque: 'Maior bloco regional',
    siglas: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
    cor: '#efc45a',
    texto: '#7c5b00',
    posicao: 'right-[10%] top-[14%] w-[36%]',
  },
  {
    nome: 'Centro-Oeste',
    destaque: 'Conexão institucional',
    siglas: ['DF', 'GO', 'MT', 'MS'],
    cor: '#79b9e8',
    texto: '#174d72',
    posicao: 'left-[30%] top-[42%] w-[28%]',
  },
  {
    nome: 'Sudeste',
    destaque: 'Maior densidade eleitoral',
    siglas: ['ES', 'MG', 'RJ', 'SP'],
    cor: '#88aef7',
    texto: '#18387a',
    posicao: 'right-[14%] top-[49%] w-[28%]',
  },
  {
    nome: 'Sul',
    destaque: 'Consulta rápida',
    siglas: ['PR', 'RS', 'SC'],
    cor: '#b38df3',
    texto: '#4b1f7c',
    posicao: 'right-[21%] bottom-[10%] w-[24%]',
  },
]

function getRegiaoAtual(ufAtual: string) {
  return regioes.find((regiao) => regiao.siglas.includes(ufAtual.toUpperCase()))
}

type MapaBrasilRegioesProps = {
  ufAtual?: string
}

function getLinkHref(sigla: string) {
  return `/busca?cargo=deputado_federal&uf=${sigla}`
}

function getRegionHref(nome: string) {
  return `/busca?cargo=deputado_federal&regiao=${encodeURIComponent(nome)}`
}

function RegionalBadge({ regiao, ufAtual }: { regiao: Regiao; ufAtual: string }) {
  const isActive = regiao.siglas.includes(ufAtual.toUpperCase())

  return (
    <Link
      href={getRegionHref(regiao.nome)}
      className={`absolute ${regiao.posicao} rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 ${
        isActive ? 'scale-[1.02] shadow-[0_20px_40px_-28px_rgba(41,82,204,0.45)] ring-2 ring-[#2952cc]/15' : 'hover:-translate-y-0.5 hover:shadow-md'
      }`}
      style={{ backgroundColor: `${regiao.cor}18`, borderColor: `${regiao.cor}44` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: regiao.texto }}>
            {regiao.nome}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">{regiao.destaque}</p>
        </div>
        <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-700">{regiao.siglas.length}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {regiao.siglas.map((sigla) => {
          const ativo = sigla === ufAtual.toUpperCase()

          return (
            <Link
              key={sigla}
              href={getLinkHref(sigla)}
              className={`inline-flex h-8 items-center justify-center rounded-full border px-2.5 text-[11px] font-semibold transition-colors ${
                ativo
                  ? 'border-[#2952cc] bg-[#2952cc] text-white'
                  : 'border-white/80 bg-white/85 text-slate-700 hover:border-[#c9d6ff] hover:bg-white hover:text-[#1e3f95]'
              }`}
            >
              {sigla}
            </Link>
          )
        })}
      </div>
    </Link>
  )
}

export function MapaBrasilRegioes({ ufAtual = '' }: MapaBrasilRegioesProps) {
  const regiaoAtual = getRegiaoAtual(ufAtual)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ff] bg-[#f4f7ff] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#2952cc]">
            <MapPinned className="size-3.5" aria-hidden="true" />
            Mapa do Brasil
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Clique na região.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            O mapa é simplificado, mas limpo e clicável. Cada bloco leva para a busca da UF e as siglas ficam visíveis no próprio painel.
          </p>
        </div>

        {regiaoAtual ? (
          <div className="rounded-2xl border border-[#dbe4ff] bg-[#f4f7ff] px-4 py-3 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2952cc]">UF em foco</p>
            <p className="mt-1 font-semibold text-slate-950">
              {ufAtual.toUpperCase()} · {regiaoAtual.nome}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="relative min-h-[620px] overflow-hidden rounded-[2rem] border border-slate-200 bg-linear-to-b from-slate-50 to-white p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(41,82,204,0.08),transparent_28%),radial-gradient(circle_at_20%_82%,rgba(124,160,255,0.10),transparent_26%),radial-gradient(circle_at_80%_78%,rgba(149,92,255,0.08),transparent_24%)]" />

          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Brasil clicável</p>
              <p className="text-xs font-medium text-slate-500">Estados destacados por região</p>
            </div>

            <div className="relative flex min-h-[520px] flex-1 items-center justify-center">
              <div className="absolute left-[11%] top-[7%] h-[84%] w-[68%] rounded-[3rem] border border-slate-200 bg-slate-100/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]" />
              <div className="absolute left-[19%] top-[16%] h-[66%] w-[50%] rounded-[2.5rem] border border-slate-200 bg-white/55" />

              {regioes.map((regiao) => (
                <RegionalBadge key={regiao.nome} regiao={regiao} ufAtual={ufAtual} />
              ))}

              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/70 bg-white/88 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur-sm">
                {regiaoAtual ? (
                  <>
                    <span className="font-semibold text-slate-950">{regiaoAtual.nome}</span>
                    <span className="text-slate-500"> · toque numa sigla para abrir a busca.</span>
                  </>
                ) : (
                  <span className="text-slate-600">Selecione uma região ou uma sigla para começar.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
            <span className="inline-block size-2 rounded-full bg-emerald-400" />
            Leitura visual
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Ação principal</p>
              <p className="mt-2 text-lg font-bold tracking-tight text-slate-950">Clique na região ou na sigla</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                O mapa agora ocupa espaço real, com áreas separadas e legíveis.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Estado destacado</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{ufAtual ? ufAtual.toUpperCase() : '—'}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {regiaoAtual ? `Pertence à região ${regiaoAtual.nome}.` : 'Digite uma cidade ou CEP para destacar sua UF.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Legenda</p>
              <div className="mt-3 grid gap-2">
                {regioes.map((regiao) => (
                  <div key={regiao.nome} className="flex items-center justify-between rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full" style={{ backgroundColor: regiao.cor }} />
                      {regiao.nome}
                    </span>
                    <span>{regiao.siglas.length} UFs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}