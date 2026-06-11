import React from 'react'
import { getPgPool } from '@/lib/db/pool'
import { EmendasDashboard } from '@/components/emendas/EmendasDashboard'

export const metadata = {
  title: 'Emendas Parlamentares - Meus Políticos',
  description: 'Portal de transparência das emendas parlamentares destinadas por deputados e senadores no Brasil.',
}

type SearchParams = Promise<{
  q?: string
  ano?: string
  tipo?: string
  uf?: string
  funcao?: string
  pagina?: string
}>

type PageProps = {
  searchParams: SearchParams
}

export default async function EmendasGeralPage({ searchParams }: PageProps) {
  const params = await searchParams
  const q = params.q || ''
  const filterAno = params.ano || ''
  const filterTipo = params.tipo || ''
  const filterUf = params.uf || ''
  const filterFuncao = params.funcao || ''
  const pagina = parseInt(params.pagina || '1', 10)

  const db = getPgPool()

  // 1. Carregar valores únicos para os filtros
  const [anosRes, tiposRes, ufsRes, funcoesRes] = await Promise.all([
    db.query<{ ano: number }>(
      'SELECT DISTINCT ano FROM emendas WHERE ano IS NOT NULL ORDER BY ano DESC'
    ),
    db.query<{ tipo_emenda: string }>(
      `SELECT DISTINCT tipo_emenda 
       FROM emendas 
       WHERE tipo_emenda IS NOT NULL AND tipo_emenda <> '' 
       ORDER BY tipo_emenda`
    ),
    db.query<{ uf_destino: string }>(
      `SELECT DISTINCT uf_destino 
       FROM emendas 
       WHERE uf_destino IS NOT NULL AND uf_destino <> '' 
       ORDER BY uf_destino`
    ),
    db.query<{ funcao: string }>(
      `SELECT DISTINCT funcao 
       FROM emendas 
       WHERE funcao IS NOT NULL AND funcao <> '' 
       ORDER BY funcao`
    ),
  ])

  const anosDisponiveis = anosRes.rows.map(r => r.ano)
  const tiposDisponiveis = tiposRes.rows.map(r => r.tipo_emenda)
  const ufsDisponiveis = ufsRes.rows.map(r => r.uf_destino)
  const funcoesDisponiveis = funcoesRes.rows.map(r => r.funcao)

  // 2. Construir cláusulas WHERE dinâmicas e seguras
  const clauses = []
  const values = []
  let index = 1

  if (q) {
    const translateTerm = `translate(LOWER($${index}), 'áàâãéèêíïóòôõúüçñ', 'aaaaeeeiiououocn')`
    clauses.push(`(
      translate(LOWER(municipio_nome), 'áàâãéèêíïóòôõúüçñ', 'aaaaeeeiiououocn') LIKE '%' || ${translateTerm} || '%' OR
      translate(LOWER(nome_parlamentar), 'áàâãéèêíïóòôõúüçñ', 'aaaaeeeiiououocn') LIKE '%' || ${translateTerm} || '%' OR
      translate(LOWER(numero_emenda), 'áàâãéèêíïóòôõúüçñ', 'aaaaeeeiiououocn') LIKE '%' || ${translateTerm} || '%'
    )`)
    values.push(q)
    index++
  }

  if (filterAno) {
    clauses.push(`ano = $${index}`)
    values.push(parseInt(filterAno, 10))
    index++
  }

  if (filterTipo) {
    clauses.push(`tipo_emenda = $${index}`)
    values.push(filterTipo)
    index++
  }

  if (filterUf) {
    clauses.push(`uf_destino = $${index}`)
    values.push(filterUf)
    index++
  }

  if (filterFuncao) {
    clauses.push(`funcao = $${index}`)
    values.push(filterFuncao)
    index++
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

  // 3. Montar as cláusulas para a query anual (deve ignorar o filtro de ano ativo para mostrar evolução temporal)
  const annualClauses = []
  const annualVals = []
  let annualIdx = 1

  if (q) {
    const translateTerm = `translate(LOWER($${annualIdx}), 'áàâãéèêíïóòôõúüçñ', 'aaaaeeeiiououocn')`
    annualClauses.push(`(
      translate(LOWER(municipio_nome), 'áàâãéèêíïóòôõúüçñ', 'aaaaeeeiiououocn') LIKE '%' || ${translateTerm} || '%' OR
      translate(LOWER(nome_parlamentar), 'áàâãéèêíïóòôõúüçñ', 'aaaaeeeiiououocn') LIKE '%' || ${translateTerm} || '%' OR
      translate(LOWER(numero_emenda), 'áàâãéèêíïóòôõúüçñ', 'aaaaeeeiiououocn') LIKE '%' || ${translateTerm} || '%'
    )`)
    annualVals.push(q)
    annualIdx++
  }

  if (filterTipo) {
    annualClauses.push(`tipo_emenda = $${annualIdx}`)
    annualVals.push(filterTipo)
    annualIdx++
  }

  if (filterUf) {
    annualClauses.push(`uf_destino = $${annualIdx}`)
    annualVals.push(filterUf)
    annualIdx++
  }

  if (filterFuncao) {
    annualClauses.push(`funcao = $${annualIdx}`)
    annualVals.push(filterFuncao)
    annualIdx++
  }

  const annualWhere = annualClauses.length > 0 ? `WHERE ${annualClauses.join(' AND ')}` : ''

  // 4. Executar queries do Dashboard
  const [kpisRes, setorialRes, annualRes, emendasRes, countRes] = await Promise.all([
    // KPIs
    db.query<{ total_empenhado: string; total_pago: string }>(
      `SELECT COALESCE(SUM(valor_empenhado), 0) AS total_empenhado,
              COALESCE(SUM(valor_pago), 0) AS total_pago
       FROM emendas
       ${whereClause}`,
      values
    ),
    // Setoriais (Pizza)
    db.query<{ name: string | null; value: string }>(
      `SELECT funcao AS name, COALESCE(SUM(valor_pago), 0) AS value
       FROM emendas
       ${whereClause}
       GROUP BY funcao
       ORDER BY value DESC`,
      values
    ),
    // Anuais (Barras)
    db.query<{ ano: number; empenhado: string; pago: string }>(
      `SELECT ano, COALESCE(SUM(valor_empenhado), 0) AS empenhado, COALESCE(SUM(valor_pago), 0) AS pago
       FROM emendas
       ${annualWhere}
       GROUP BY ano
       ORDER BY ano`,
      annualVals
    ),
    // Listagem paginada
    db.query<{
      id: string
      codigo_emenda: string
      ano: number
      valor: string
      valor_pago: string
      municipio_nome: string
      uf_municipio: string
      municipio_destino: string | null
      uf_destino: string | null
      funcao: string
      autor_nome: string
      politico_slug: string | null
    }>(
      `SELECT e.id, 
              e.numero_emenda AS codigo_emenda, 
              e.ano, 
              e.valor_empenhado AS valor, 
              e.valor_pago, 
              e.municipio_nome, 
              e.uf_municipio, 
              e.municipio_destino,
              e.uf_destino,
              e.funcao, 
              e.nome_parlamentar AS autor_nome,
              p.slug AS politico_slug
       FROM emendas e
       LEFT JOIN politicos p ON p.id = e.politico_id
       ${whereClause}
       ORDER BY e.valor_pago DESC, e.id
       LIMIT 10 OFFSET ${(pagina - 1) * 10}`,
      values
    ),
    // Total de itens
    db.query<{ count: string }>(
      `SELECT COUNT(*) FROM emendas ${whereClause}`,
      values
    ),
  ])

  // 5. Processar dados para a interface
  const totalItems = parseInt(countRes.rows[0].count, 10)
  
  const totalEmpenhado = parseFloat(kpisRes.rows[0].total_empenhado || '0')
  const totalPago = parseFloat(kpisRes.rows[0].total_pago || '0')
  const taxaExecucao = totalEmpenhado > 0 ? Math.round((totalPago / totalEmpenhado) * 100) : 0

  const setorialRows = setorialRes.rows.map(r => ({
    name: r.name || 'Outras áreas',
    value: parseFloat(r.value || '0')
  }))

  const topFuncaoNome = setorialRows[0]?.name || 'Saúde'
  const topFuncaoValor = setorialRows[0]?.value || 0

  // Agrupar em top 5 + outros para o donut
  const dadosSetoriais = []
  if (setorialRows.length > 5) {
    dadosSetoriais.push(...setorialRows.slice(0, 5))
    const outrosSoma = setorialRows.slice(5).reduce((acc, curr) => acc + curr.value, 0)
    if (outrosSoma > 0) {
      dadosSetoriais.push({ name: 'Outras áreas', value: outrosSoma })
    }
  } else {
    dadosSetoriais.push(...setorialRows)
  }

  const dadosAnuais = annualRes.rows.map(r => ({
    ano: r.ano,
    empenhado: parseFloat(r.empenhado || '0'),
    pago: parseFloat(r.pago || '0')
  }))

  const emendasList = emendasRes.rows.map(r => ({
    id: r.id,
    codigo_emenda: r.codigo_emenda,
    ano: r.ano,
    valor: parseFloat(r.valor || '0'),
    valor_pago: parseFloat(r.valor_pago || '0'),
    municipio_nome: r.municipio_nome || '',
    uf_municipio: r.uf_municipio || '',
    municipio_destino: r.municipio_destino || '',
    uf_destino: r.uf_destino || '',
    funcao: r.funcao || 'Não informada',
    autor_nome: r.autor_nome || 'Bancada / Coletivo',
    politico_slug: r.politico_slug
  }))

  const kpis = {
    totalEmpenhado,
    totalPago,
    taxaExecucao,
    topFuncaoNome,
    topFuncaoValor,
  }

  const filters = {
    q,
    ano: filterAno,
    tipo: filterTipo,
    uf: filterUf,
    funcao: filterFuncao,
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-[#CBD5E1] pt-24 pb-16 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero */}
        <section className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="material-symbols-outlined text-[#8B5CF6] text-[40px]" style={{ fontVariationSettings: '"FILL" 1' }}>
            payments
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Emendas Parlamentares
          </h1>
          <p className="text-sm md:text-base text-[#94A3B8] leading-relaxed">
            Acompanhe em tempo real a destinação e execução do dinheiro público enviado por deputados e senadores para estados e municípios do Brasil.
          </p>
        </section>

        {/* Dashboard Client Component */}
        <EmendasDashboard
          anosDisponiveis={anosDisponiveis}
          tiposDisponiveis={tiposDisponiveis}
          ufsDisponiveis={ufsDisponiveis}
          funcoesDisponiveis={funcoesDisponiveis}
          dadosSetoriais={dadosSetoriais}
          dadosAnuais={dadosAnuais}
          emendasList={emendasList}
          totalItems={totalItems}
          currentPage={pagina}
          filters={filters}
          kpis={kpis}
        />
      </div>
    </main>
  )
}
