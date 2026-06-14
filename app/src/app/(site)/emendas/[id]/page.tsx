import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPgPool } from '@/lib/db/pool'
import { EmendaExecutionTracker } from '@/components/emendas/EmendaExecutionTracker'
import { EmendaIAPergunta } from '@/components/emendas/EmendaIAPergunta'
import { GlossaryHighlighter } from '@/components/glossario/GlossaryHighlighter'

type PageProps = {
  params: Promise<{ id: string }>
}

type EmendaDetalhe = {
  id: string
  codigo_emenda: string
  ano: number
  tipo_emenda: string
  politico_id: string | null
  autor_nome: string
  valor: string
  valor_empenhado: string
  valor_liquidado: string
  valor_pago: string
  uf_destino: string
  municipio_destino: string
  municipio_ibge: string | null
  municipio_nome: string
  uf_municipio: string
  funcao: string
  area: string
  pol_nome_eleitoral: string | null
  pol_slug: string | null
  pol_foto_url: string | null
  pol_cargo: string | null
  pol_email: string | null
  pol_gabinete_telefone: string | null
  partido_sigla: string | null
}

// Função de apoio para gerar título simplificado
function obterTituloAmigavel(e: {
  funcao?: string | null
  area?: string | null
  municipio_nome?: string | null
  uf_municipio?: string | null
  municipio_destino?: string | null
  uf_destino?: string | null
}) {
  let areaInfo = e.funcao || e.area || 'Repasse de Recursos'
  if (areaInfo.toLowerCase().includes('múltiplo') || areaInfo.toLowerCase().includes('multiplo')) {
    areaInfo = 'Recursos Múltiplos'
  }

  // Resolver a descrição amigável do destino
  let cidadeInfo = 'Município de Destino'
  
  if (e.municipio_nome && e.uf_municipio) {
    cidadeInfo = `${e.municipio_nome} (${e.uf_municipio})`
  } else if (e.municipio_destino) {
    const destLower = e.municipio_destino.toLowerCase()
    if (destLower.includes('múltiplo') || destLower.includes('multiplo')) {
      cidadeInfo = 'Múltiplos Municípios'
    } else if (destLower.includes('nacional')) {
      cidadeInfo = 'Nacional (Todo o país)'
    } else if (destLower.includes('(uf)') || e.uf_destino === 'UF') {
      const estadoNome = e.municipio_destino.replace(/\(uf\)/i, '').trim()
      cidadeInfo = `Todo o estado (${estadoNome})`
    } else {
      cidadeInfo = e.municipio_destino
    }
  } else if (e.uf_destino && e.uf_destino !== 'UF') {
    cidadeInfo = `Estado de destino (${e.uf_destino})`
  } else if (areaInfo === 'Recursos Múltiplos') {
    cidadeInfo = 'Múltiplos Municípios'
  }

  return `${areaInfo} para ${cidadeInfo}`.trim()
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const db = getPgPool()
  const { rows } = await db.query(
    `SELECT e.numero_emenda AS codigo_emenda, e.nome_parlamentar AS autor_nome,
            e.municipio_nome, e.uf_municipio, e.municipio_destino, e.uf_destino, e.funcao, e.area
     FROM emendas e WHERE e.id = $1 LIMIT 1`,
    [id]
  )
  const item = rows[0]
  if (!item) return { title: 'Emenda não encontrada' }

  // Parse do município caso esteja nulo
  let municipioNome = item.municipio_nome
  let ufMunicipio = item.uf_municipio
  if (!municipioNome && item.municipio_destino) {
    const destLower = item.municipio_destino.toLowerCase()
    if (!destLower.includes('múltiplo') && !destLower.includes('multiplo') && !destLower.includes('nacional') && !destLower.includes('(uf)')) {
      const parts = item.municipio_destino.split(' - ')
      if (parts.length === 2) {
        municipioNome = parts[0].trim()
        ufMunicipio = parts[1].trim()
      } else {
        municipioNome = item.municipio_destino
      }
    }
  }

  const friendlyTitle = obterTituloAmigavel({
    funcao: item.funcao,
    area: item.area,
    municipio_nome: municipioNome,
    uf_municipio: ufMunicipio,
    municipio_destino: item.municipio_destino,
    uf_destino: item.uf_destino
  })

  const titleWithAutor = item.autor_nome ? `${friendlyTitle} por ${item.autor_nome}` : friendlyTitle

  return {
    title: `${titleWithAutor} - Meus Políticos`,
    description: `Destinação de recursos de ${item.autor_nome || 'Emenda'} para ${municipioNome || item.municipio_destino || 'destino'}.`,
  }
}

export default async function EmendaFichaPage({ params }: PageProps) {
  const { id } = await params
  const db = getPgPool()

  const { rows } = await db.query<EmendaDetalhe>(
    `SELECT e.id,
            e.numero_emenda AS codigo_emenda,
            e.ano,
            e.tipo_emenda,
            e.politico_id,
            e.nome_parlamentar AS autor_nome,
            e.valor,
            e.valor_empenhado,
            e.valor_liquidado,
            e.valor_pago,
            e.uf_destino,
            e.municipio_destino,
            e.municipio_ibge,
            e.municipio_nome,
            e.uf_municipio,
            e.funcao,
            e.area, 
            p.nome_eleitoral AS pol_nome_eleitoral,
            p.slug AS pol_slug,
            p.foto_url AS pol_foto_url,
            p.cargo::text AS pol_cargo,
            p.email AS pol_email,
            p.gabinete_telefone AS pol_gabinete_telefone,
            pt.sigla AS partido_sigla
     FROM emendas e
     LEFT JOIN politicos p ON p.id = e.politico_id
     LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE e.id = $1 LIMIT 1`,
    [id]
  )

  const emenda = rows[0]
  if (!emenda) notFound()

  // 1. Resolver município nulo a partir de municipio_destino
  let municipioNome = emenda.municipio_nome
  let ufMunicipio = emenda.uf_municipio
  let isDestinoEspecial = false
  let destinoEspecialLabel = ''

  if (emenda.municipio_destino) {
    const destLower = emenda.municipio_destino.toLowerCase()
    if (destLower.includes('múltiplo') || destLower.includes('multiplo')) {
      isDestinoEspecial = true
      destinoEspecialLabel = 'Múltiplos municípios'
      municipioNome = 'Múltiplos municípios'
      ufMunicipio = ''
    } else if (destLower.includes('nacional')) {
      isDestinoEspecial = true
      destinoEspecialLabel = 'Nacional (Todo o país)'
      municipioNome = 'Nacional'
      ufMunicipio = ''
    } else if (destLower.includes('(uf)') || emenda.uf_destino === 'UF') {
      isDestinoEspecial = true
      const estadoNome = emenda.municipio_destino.replace(/\(uf\)/i, '').trim()
      destinoEspecialLabel = `Estadual (Todo o estado - ${estadoNome})`
      municipioNome = `Todo o estado (${estadoNome})`
      ufMunicipio = ''
    } else {
      const parts = emenda.municipio_destino.split(' - ')
      if (parts.length === 2) {
        municipioNome = parts[0].trim()
        ufMunicipio = parts[1].trim()
      } else {
        municipioNome = emenda.municipio_destino
      }
    }
  } else if (!municipioNome && (emenda.funcao?.toLowerCase() === 'múltiplo' || emenda.area?.toLowerCase().includes('múltiplo'))) {
    isDestinoEspecial = true
    destinoEspecialLabel = 'Múltiplos municípios'
    municipioNome = 'Múltiplos municípios'
    ufMunicipio = ''
  }

  // 2. Resolver código IBGE nulo no banco buscando em municipios
  let municipioIbge = emenda.municipio_ibge
  if (isDestinoEspecial) {
    municipioIbge = 'Não aplicável'
  } else if (!municipioIbge && municipioNome && ufMunicipio) {
    const muniRes = await db.query<{ codigo_ibge: number }>(
      `SELECT codigo_ibge FROM municipios WHERE UPPER(nome) = $1 AND uf = $2 LIMIT 1`,
      [municipioNome.toUpperCase(), ufMunicipio.toUpperCase()]
    )
    if (muniRes.rows[0]) {
      municipioIbge = muniRes.rows[0].codigo_ibge.toString()
    }
  }

  // 3. Obter total de emendas do município destino no ano (apenas se não for destino amplo)
  let totalMunicipioEmendas = 0
  if (!isDestinoEspecial && municipioNome && ufMunicipio) {
    const citySumRes = await db.query<{ total: string }>(
      `SELECT COALESCE(SUM(valor_pago), 0) AS total
       FROM emendas
       WHERE (municipio_ibge = $1 OR (municipio_nome = $2 AND uf_municipio = $3))
         AND ano = $4`,
      [municipioIbge, municipioNome, ufMunicipio, emenda.ano]
    )
    totalMunicipioEmendas = parseFloat(citySumRes.rows[0].total || '0')
  }

  const valorEmpenhadoNum = parseFloat(emenda.valor_empenhado || emenda.valor || '0')
  const valorLiquidadoNum = parseFloat(emenda.valor_liquidado || '0')
  const valorPagoNum = parseFloat(emenda.valor_pago || '0')

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Análise local IA (Fallback determinístico / explicador dinâmico de orçamento)
  const analiseIA = (() => {
    const cidade = isDestinoEspecial ? (destinoEspecialLabel || 'múltiplos municípios') : (municipioNome ? `${municipioNome} (${ufMunicipio})` : 'município de destino')
    const area = (emenda.area || 'recursos').toLowerCase()
    const funcao = emenda.funcao || 'serviços públicos'

    if (valorPagoNum >= 5e6) {
      return `Esta emenda representa um investimento orçamentário de grande porte com impacto para <strong>${cidade}</strong>. Recursos dessa magnitude costumam ser destinados a intervenções estruturais na área de <strong>${funcao}</strong> (como saneamento básico amplo, aquisição de equipamentos de alta complexidade ou reforma de hospitais regionais). É fundamental que a sociedade acompanhe a execução física da obra ou destinação.`
    }
    if (valorPagoNum >= 1e6) {
      return `O repasse de <strong>${formatCurrency(valorPagoNum)}</strong> destinado a <strong>${cidade}</strong> para ações de <strong>${area}</strong> é de impacto médio-alto. Esse valor é suficiente para financiar o custeio de unidades locais de atendimento (como UBSs e escolas), pavimentação de vias ou aquisição de frotas de ambulâncias/transporte escolar. A transparência na licitação local garante o bom uso do recurso.`
    }
    return `Destinação de custeio de menor porte com impacto para <strong>${cidade}</strong>. Comumente utilizada para suprir deficits operacionais imediatos na área de <strong>${funcao}</strong> (compra de insumos médicos básicos, merenda escolar ou pequenas reformas pontuais). Representa um reforço ágil no caixa local.`
  })()

  const friendlyTitle = obterTituloAmigavel({
    funcao: emenda.funcao,
    area: emenda.area,
    municipio_nome: municipioNome,
    uf_municipio: ufMunicipio,
    municipio_destino: emenda.municipio_destino,
    uf_destino: emenda.uf_destino
  })

  return (
    <main className="min-h-screen bg-[#0F172A] text-[#CBD5E1] pt-24 pb-16 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <Link href="/emendas" className="hover:text-white transition-colors">Emendas</Link>
          <span>/</span>
          <span className="text-white font-mono">{emenda.codigo_emenda}</span>
        </div>

        {/* Ficha Header */}
        <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#334155] pb-4 mb-4">
            <div>
              <span className="bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Emenda {emenda.tipo_emenda || 'Orçamentária'} · {emenda.codigo_emenda}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white mt-1.5 tracking-tight">
                {friendlyTitle}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#64748B] font-mono block">ANO DE EXERCÍCIO</span>
              <span className="text-white font-extrabold text-lg font-mono">{emenda.ano}</span>
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0F172A]/40 border border-[#334155]/60 rounded-lg p-4">
              <span className="text-[10px] text-[#94A3B8] font-mono block mb-1">RESERVADO (EMPENHADO)</span>
              <span className="text-base font-extrabold text-white font-mono block">
                {formatCurrency(valorEmpenhadoNum)}
              </span>
            </div>
            <div className="bg-[#0F172A]/40 border border-[#334155]/60 rounded-lg p-4">
              <span className="text-[10px] text-[#A78BFA] font-mono block mb-1">LIQUIDADO (VERIFICADO)</span>
              <span className="text-base font-extrabold text-white font-mono block">
                {formatCurrency(valorLiquidadoNum)}
              </span>
            </div>
            <div className="bg-[#0F172A]/40 border border-[#10B981]/30 rounded-lg p-4">
              <span className="text-[10px] text-[#10B981] font-mono block mb-1">ENTREGUE (PAGO)</span>
              <span className="text-base font-extrabold text-[#34D399] font-mono block">
                {formatCurrency(valorPagoNum)}
              </span>
            </div>
          </div>
        </section>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Tracker e Ficha Técnica (Col span 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visual Tracker */}
            <EmendaExecutionTracker
              valorEmpenhado={valorEmpenhadoNum}
              valorLiquidado={valorLiquidadoNum}
              valorPago={valorPagoNum}
              municipioNome={municipioNome || 'Não informado'}
              ufMunicipio={ufMunicipio || ''}
              totalMunicipioEmendas={totalMunicipioEmendas}
            />

            {/* Ficha Técnica */}
            <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-md space-y-4">
              <h3 className="text-white font-bold text-sm tracking-wide border-b border-[#334155] pb-2 mb-3">
                Ficha Técnica de Destino
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] font-medium block">Município Destino</span>
                  <span className="text-white font-semibold">
                    {isDestinoEspecial ? (destinoEspecialLabel || 'Não informado') : `${municipioNome || 'Não informado'}${ufMunicipio ? ` - ${ufMunicipio}` : ''}`}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium block">Código IBGE Município</span>
                  <span className="text-[#CBD5E1] font-mono">{municipioIbge || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium block">Área de Destinação</span>
                  <span className="text-[#CBD5E1] font-semibold">{emenda.area || (emenda.funcao ? `${emenda.funcao} · Geral` : 'Não informada')}</span>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium block">Função do Orçamento</span>
                  <span className="text-[#CBD5E1] font-semibold">{emenda.funcao || emenda.area || 'Não informada'}</span>
                </div>
              </div>

              {isDestinoEspecial && (
                <div className="border-t border-[#334155]/60 pt-3 mt-2 flex items-start gap-1.5 text-[10px] text-[#94A3B8] leading-relaxed">
                  <span className="material-symbols-outlined text-[14px] text-[#A78BFA] flex-shrink-0 mt-0.5">help_outline</span>
                  <span>
                    <strong>Nota:</strong> Emendas com destinação múltipla, estadual ou nacional não são alocadas em um município único exclusivo e, portanto, não possuem um código IBGE municipal associado.
                  </span>
                </div>
              )}
            </section>
          </div>

          {/* Coluna Direita: Autor, Gabinete e IA (Col span 5) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Autoria Card */}
            <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-md">
              <h3 className="text-white font-bold text-sm tracking-wide border-b border-[#334155] pb-2 mb-4">
                Autor da Emenda
              </h3>
              
              <div className="flex items-center gap-3">
                {emenda.pol_foto_url ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#334155] flex-shrink-0">
                    <Image
                      src={emenda.pol_foto_url}
                      alt={emenda.pol_nome_eleitoral || emenda.autor_nome}
                      fill
                      sizes="48px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {emenda.autor_nome.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  {emenda.pol_slug ? (
                    <Link
                      href={`/politicos/${emenda.pol_slug}`}
                      className="text-white font-extrabold text-sm hover:text-[#8B5CF6] transition-colors block truncate"
                    >
                      {emenda.pol_nome_eleitoral || emenda.autor_nome}
                    </Link>
                  ) : (
                    <h4 className="text-white font-extrabold text-sm block truncate">{emenda.autor_nome}</h4>
                  )}
                  <span className="text-xs text-[#94A3B8] font-mono block">
                    {emenda.partido_sigla ? `${emenda.partido_sigla} · ${emenda.uf_destino || ufMunicipio}` : 'Bancada / Coletivo'}
                  </span>
                </div>
              </div>

              {/* Botões de Ação com o Gabinete */}
              {emenda.pol_email && (
                <div className="mt-5 pt-4 border-t border-[#334155]/60 space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider block mb-1">Fiscalização Cívica</span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={`mailto:${emenda.pol_email}?subject=Dúvidas sobre emenda ${emenda.codigo_emenda}`}
                      className="flex-1 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/30 text-white text-center py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      Cobrar Gabinete ✉️
                    </a>
                    {emenda.pol_gabinete_telefone && (
                      <a
                        href={`tel:${emenda.pol_gabinete_telefone.replace(/\D/g, '')}`}
                        className="flex-1 bg-transparent hover:bg-[#334155] border border-slate-700 text-white text-center py-2 rounded-lg text-xs font-semibold transition-all"
                      >
                        Ligar para Gabinete 📞
                      </a>
                    )}
                  </div>
                  <span className="text-[9px] text-[#64748B] text-center block leading-normal">
                    Entre em contato com o autor para questionar a destinação ou andamento do recurso.
                  </span>
                </div>
              )}
            </section>

             {/* Chat de IA Interativo (Com a Análise de Impacto unificada na primeira mensagem) */}
             <EmendaIAPergunta 
               emendaId={emenda.id} 
               codigoEmenda={emenda.codigo_emenda} 
               analiseInicial={<GlossaryHighlighter>{analiseIA}</GlossaryHighlighter>}
             />
          </div>
        </div>

      </div>
    </main>
  )
}
