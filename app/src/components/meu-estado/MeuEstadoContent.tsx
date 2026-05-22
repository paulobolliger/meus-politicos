import Image from 'next/image'
import Link from 'next/link'
import { Pool } from 'pg'

import { CepForm } from '@/components/meu-estado/CepForm'
import { CardRepresentante } from '@/components/meu-estado/CardRepresentante'
import { CarrosselSecao } from '@/components/meu-estado/CarrosselSecao'

// ─── Types ──────────────────────────────────────────────────────────────────

type ViaCepResponse = {
  localidade?: string
  uf?: string
  ibge?: string
  erro?: boolean
}

type NominatimResponse = {
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    state_code?: string
  }
}

type Representante = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  foto_url: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  partidos: { sigla: string | null } | null
}

type DeputadoPg = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  foto_url: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  sigla: string | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const UF_POR_ESTADO: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA',
  ceara: 'CE', 'distrito federal': 'DF', 'espirito santo': 'ES', goias: 'GO',
  maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', para: 'PA', paraiba: 'PB', parana: 'PR',
  pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN', 'rio grande do sul': 'RS',
  rondonia: 'RO', roraima: 'RR', 'santa catarina': 'SC',
  'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO',
}

function normalizarTexto(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function nomeParaUf(nomeEstado?: string, stateCode?: string) {
  if (stateCode) return stateCode.toUpperCase()
  if (!nomeEstado) return ''
  return UF_POR_ESTADO[normalizarTexto(nomeEstado)] ?? ''
}

function nomeExibicao(rep: Representante) {
  return rep.nome_eleitoral ?? rep.nome
}

function corPresenca(v: number | null): string {
  if (v == null) return 'var(--ink-3)'
  if (v >= 80)   return 'var(--pos)'
  if (v >= 60)   return 'var(--warn)'
  return 'var(--neg)'
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function resolverLocalidade(entrada: string) {
  const valor          = entrada.trim()
  const somenteNumeros = valor.replace(/\D/g, '')

  if (!valor) return { cidade: '', uf: '', erro: 'Digite uma cidade ou um CEP.' }

  if (somenteNumeros.length === 8) {
    const viaCep = await fetch(`https://viacep.com.br/ws/${somenteNumeros}/json/`, { cache: 'no-store' })
    const local  = (await viaCep.json()) as ViaCepResponse
    if (!viaCep.ok || local.erro) return { cidade: '', uf: '', erro: 'CEP inválido. Tente novamente.' }
    if (!local.uf) return { cidade: '', uf: '', erro: 'Não foi possível identificar a UF para este CEP.' }
    return { cidade: local.localidade ?? '', uf: local.uf, erro: '' }
  }

  const buscaCidade = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(valor)}&countrycodes=br&format=jsonv2&addressdetails=1&limit=5`,
    { cache: 'no-store', headers: { Accept: 'application/json' } }
  )
  if (!buscaCidade.ok) return { cidade: '', uf: '', erro: 'Não foi possível buscar a cidade. Tente novamente.' }

  const resultados     = (await buscaCidade.json()) as NominatimResponse[]
  const melhorResultado = resultados.find((i) => i.address?.state) ?? resultados[0]
  const uf             = nomeParaUf(melhorResultado?.address?.state, melhorResultado?.address?.state_code)
  const cidade         = melhorResultado?.address?.city ?? melhorResultado?.address?.town ?? melhorResultado?.address?.village ?? valor

  if (!uf) return { cidade: '', uf: '', erro: 'Não encontramos a UF dessa cidade. Tente CEP ou nome completo.' }
  return { cidade, uf, erro: '' }
}

let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host:     process.env.POSTGRES_HOST     ?? 'localhost',
      port:     Number(process.env.POSTGRES_PORT ?? '5433'),
      user:     process.env.POSTGRES_USER     ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB       ?? 'meuspoliticos_db',
      connectionTimeoutMillis: 4000,
    })
  }
  return _pool
}

function mapRow(row: DeputadoPg): Representante {
  return {
    id: row.id, slug: row.slug, nome: row.nome, nome_eleitoral: row.nome_eleitoral,
    cargo: row.cargo, uf: row.uf, foto_url: row.foto_url,
    presenca_pct_atual: row.presenca_pct_atual, gasto_total_ano: row.gasto_total_ano,
    total_votacoes: row.total_votacoes, partidos: { sigla: row.sigla },
  }
}

async function buscarPorCargoPostgres(
  cargo: string,
  uf?: string,
  limite?: number
): Promise<Representante[]> {
  const conditions = ['p.removido_em IS NULL', `p.cargo = $1`]
  const params: (string | number)[] = [cargo]

  if (uf) { params.push(uf); conditions.push(`p.uf = $${params.length}`) }

  const limitClause = limite ? `LIMIT ${limite}` : ''

  const sql = `
    SELECT p.id, p.slug, p.nome, p.nome_eleitoral, p.cargo::text AS cargo,
           p.uf, p.foto_url, p.presenca_pct_atual, p.gasto_total_ano, p.total_votacoes, pa.sigla
    FROM politicos p
    LEFT JOIN partidos pa ON pa.id = p.partido_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.nome_eleitoral ASC NULLS LAST
    ${limitClause}
  `
  const result = await getPool().query<DeputadoPg>(sql, params)
  return result.rows.map(mapRow)
}

// ─── Inline components ────────────────────────────────────────────────────────

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--line)', paddingBottom: 14, marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
          {title}
        </h2>
      </div>
      <span style={{
        background: 'var(--bg-2)', color: 'var(--ink-3)',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
        padding: '4px 12px', borderRadius: 4,
        fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
      }}>
        {badge}
      </span>
    </div>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px dashed var(--line-strong)',
      borderRadius: 12, padding: '40px 24px', textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)' }}>{message}</p>
    </div>
  )
}

// ─── Page props ───────────────────────────────────────────────────────────────

type Props = {
  searchParams: Record<string, string | string[] | undefined>
}

// ─── Main component ───────────────────────────────────────────────────────────

export async function MeuEstadoContent({ searchParams }: Props) {
  function parseTexto(valor?: string | string[]) {
    if (!valor) return ''
    return (Array.isArray(valor) ? valor[0] : valor).trim()
  }

  const localidade = parseTexto(searchParams.local || searchParams.cep)

  let cidade = ''
  let uf     = ''
  let erroCep = ''

  if (localidade) {
    const resultado = await resolverLocalidade(localidade)
    cidade  = resultado.cidade
    uf      = resultado.uf
    erroCep = resultado.erro
  }

  let presidente:       Representante[] = []
  let governador:       Representante[] = []
  let senadores:        Representante[] = []
  let deputados:        Representante[] = []
  let deputadosEstad:   Representante[] = []

  if (uf) {
    try {
      ;[presidente, governador, senadores, deputados, deputadosEstad] = await Promise.all([
        buscarPorCargoPostgres('presidente',       undefined, 1),
        buscarPorCargoPostgres('governador',       uf, 1),
        buscarPorCargoPostgres('senador',          uf),
        buscarPorCargoPostgres('deputado_federal', uf),
        buscarPorCargoPostgres('deputado_estadual', uf),
      ])
    } catch {
      // tunnel não ativo — seções ficam vazias
    }
  }

  const mostrarSecoes = Boolean(localidade && !erroCep && uf)
  const govCard       = governador[0] ?? null

  // ─── Icons ──────────────────────────────────────────────────────────────────

  const IconFederal = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--brand-2)" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1L3 6v2h18V6L12 1zm-9 8v2h2v7H3v2h18v-2h-2v-7h2v-2H3zm4 2h2v7H7v-7zm4 0h2v7h-2v-7zm4 0h2v7h-2v-7z"/>
    </svg>
  )

  const IconEstadual = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--brand-2)" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 11V5l-3-3-3 3v2H3v13h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
    </svg>
  )

  const IconMunicipal = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--brand-2)" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  )

  // ─── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(to bottom, var(--bg-2) 0%, var(--bg) 100%)',
        borderBottom: '1px solid var(--line)',
        padding: '64px 24px 72px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 56, alignItems: 'flex-start', justifyContent: 'center' }}>

            {/* Center: título + form */}
            <div style={{ flex: '0 1 640px', minWidth: 0, textAlign: 'center' }}>
              <h1 style={{
                margin: '0 0 14px',
                fontSize: 'clamp(32px, 4.5vw, 48px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: 'var(--ink)',
                lineHeight: 1.1,
              }}>
                Meus Representantes
              </h1>
              <p style={{
                margin: '0 0 28px',
                fontSize: 16,
                color: 'var(--ink-3)',
                lineHeight: 1.65,
                maxWidth: 520,
                marginInline: 'auto',
              }}>
                Transparência para decidir melhor. Localize os parlamentares que representam o seu estado no Congresso Nacional e na Assembleia Legislativa.
              </p>

              <CepForm defaultLocalidade={localidade} />

              {erroCep && (
                <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--neg)' }}>{erroCep}</p>
              )}
            </div>

            {/* Right: governor card (when location found) */}
            {mostrarSecoes && govCard && (
              <div style={{ flexShrink: 0, width: 260 }}>
                <Link href={`/politicos/${govCard.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'white',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.09)',
                  }}>
                    {/* Mini photo */}
                    <div style={{
                      height: 140,
                      position: 'relative',
                      background: 'white',
                      overflow: 'hidden',
                      clipPath: 'inset(0 0 0 0 round 16px 16px 0 0)',
                    }}>
                      {govCard.foto_url ? (
                        <Image
                          src={govCard.foto_url}
                          alt={nomeExibicao(govCard)}
                          fill
                          style={{ objectFit: 'contain', objectPosition: 'center top' }}
                          unoptimized
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>
                              {nomeExibicao(govCard).split(' ').slice(0, 2).map(p => p[0]).join('')}
                            </span>
                          </div>
                        </div>
                      )}
                      <span style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'var(--accent)', color: 'white',
                        fontSize: 9, fontWeight: 700, padding: '3px 8px',
                        borderRadius: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                      }}>
                        Governador · {govCard.uf}
                      </span>
                    </div>

                    {/* Mini info */}
                    <div style={{ padding: '12px 14px 14px' }}>
                      <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                        {nomeExibicao(govCard)}
                      </p>
                      {govCard.presenca_pct_atual != null && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                            <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>PRESENÇA</span>
                            <span style={{ fontWeight: 700, color: corPresenca(govCard.presenca_pct_atual), fontFamily: 'var(--font-mono)' }}>
                              {govCard.presenca_pct_atual}%
                            </span>
                          </div>
                          <div style={{ height: 3, background: 'var(--bg-2)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${govCard.presenca_pct_atual}%`, background: corPresenca(govCard.presenca_pct_atual), borderRadius: 2 }} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Localização confirmada ── */}
      {mostrarSecoes && (
        <div style={{
          background: 'var(--bg-2)', borderBottom: '1px solid var(--line)',
          padding: '10px 24px',
        }}>
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <span style={{ fontSize: 13, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>
              📍 {cidade || 'Localidade'} · {uf}
            </span>
            <span style={{
              background: 'var(--pos-soft)', color: 'var(--pos)',
              border: '1px solid var(--pos)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              padding: '3px 8px', borderRadius: 4,
              fontFamily: 'var(--font-mono)',
            }}>
              LOCALIZAÇÃO IDENTIFICADA
            </span>
          </div>
        </div>
      )}

      {/* ── Resultados ── */}
      {mostrarSecoes ? (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 64px', display: 'flex', flexDirection: 'column', gap: 56 }}>

          {/* Nível Federal */}
          <CarrosselSecao icon={IconFederal} titulo="Nível Federal" badge="Brasília · DF">
            {[...senadores, ...deputados].map((rep) => (
              <div key={rep.id} style={{ flexShrink: 0, width: 260, scrollSnapAlign: 'start' }}>
                <CardRepresentante
                  nome={nomeExibicao(rep)}
                  partido={rep.partidos?.sigla}
                  uf={rep.uf}
                  cargoKey={rep.cargo}
                  presencaPct={rep.presenca_pct_atual}
                  gastoTotalAno={rep.gasto_total_ano}
                  foto_url={rep.foto_url}
                  href={`/politicos/${rep.slug}`}
                  variant="federal"
                />
              </div>
            ))}
            {senadores.length === 0 && deputados.length === 0 && (
              <div style={{ padding: '40px 24px', color: 'var(--ink-3)', fontSize: 14 }}>
                Nenhum resultado — tente outro CEP.
              </div>
            )}
          </CarrosselSecao>

          {/* Nível Estadual */}
          <CarrosselSecao icon={IconEstadual} titulo="Nível Estadual" badge={`Assembleia Legislativa · ${uf}`}>
            {deputadosEstad.length > 0 ? deputadosEstad.map((rep) => (
              <div key={rep.id} style={{ flexShrink: 0, width: 260, scrollSnapAlign: 'start' }}>
                <CardRepresentante
                  nome={nomeExibicao(rep)}
                  partido={rep.partidos?.sigla}
                  uf={rep.uf}
                  cargoKey={rep.cargo}
                  presencaPct={rep.presenca_pct_atual}
                  gastoTotalAno={rep.gasto_total_ano}
                  foto_url={rep.foto_url}
                  href={`/politicos/${rep.slug}`}
                  variant="federal"
                />
              </div>
            )) : (
              <div style={{ padding: '40px 24px', color: 'var(--ink-3)', fontSize: 14 }}>
                🏗️ Dados de deputados estaduais em breve.
              </div>
            )}
          </CarrosselSecao>

          {/* Nível Municipal */}
          <CarrosselSecao icon={IconMunicipal} titulo="Nível Municipal" badge={cidade ? `Câmara Municipal · ${cidade}` : `Câmara Municipal · ${uf}`}>
            <div style={{ padding: '40px 24px', color: 'var(--ink-3)', fontSize: 14 }}>
              🏗️ Dados de vereadores em breve.
            </div>
          </CarrosselSecao>

        </div>
      ) : (
        /* Estado inicial — sem localidade */
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
          <div style={{
            background: 'var(--panel)', border: '1px dashed var(--line-strong)',
            borderRadius: 16, padding: '64px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📍</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
              Digite seu CEP para ver seus representantes
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', maxWidth: 400, marginInline: 'auto' }}>
              Identifique os senadores e deputados federais pelo seu estado, além do governador.
            </p>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <section style={{
        background: 'var(--panel)',
        borderTop: '1px solid var(--line)',
        padding: '72px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>

          {/* Left */}
          <div>
            <h2 style={{
              margin: '0 0 14px',
              fontSize: 'clamp(24px, 3vw, 34px)',
              fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.2,
            }}>
              Acompanhe as votações em tempo real
            </h2>
            <p style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.65, maxWidth: 480 }}>
              Cadastre-se para receber notificações sempre que um dos seus representantes votar em projetos de lei importantes para o seu estado.
            </p>
            <Link href="/conta" style={{
              display: 'inline-block',
              background: 'var(--ink)', color: 'white',
              padding: '12px 28px', borderRadius: 10,
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}>
              Ativar Alertas Gratuitos
            </Link>
          </div>

          {/* Right */}
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            {/* Newsletter */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'var(--brand-soft, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                  Newsletter Semanal
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  Resumo dos gastos e atividades dos seus parlamentares diretamente no seu e-mail.
                </p>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--line)' }} />

            {/* Ranking */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'var(--pos-soft, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                  Ranking de Atuação
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  Compare o desempenho dos seus representantes com a média nacional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
