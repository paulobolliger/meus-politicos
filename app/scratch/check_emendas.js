const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('Arquivo .env.local não encontrado no caminho: ' + envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const index = trimmed.indexOf('=');
  if (index === -1) return;
  const key = trimmed.slice(0, index).trim();
  const val = trimmed.slice(index + 1).trim();
  env[key] = val.replace(/(^["']|["']$)/g, ''); // strip quotes
});

const config = {
  host: env.POSTGRES_HOST || 'localhost',
  port: parseInt(env.POSTGRES_PORT || '5432', 10),
  database: env.POSTGRES_DB || 'meuspoliticos_db',
  user: env.POSTGRES_USER || 'postgres',
  password: env.POSTGRES_PASSWORD || '',
  ssl: env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

const client = new Client(config);

async function run() {
  await client.connect();
  console.log('Conectado ao banco de dados.');

  // 1. Totais Gerais
  console.log('\n=== TOTAIS GERAIS DE EMENDAS ===');
  const resTotais = await client.query(`
    SELECT 
      COUNT(*) AS total_registros,
      SUM(valor_empenhado) AS soma_empenhado,
      SUM(valor_liquidado) AS soma_liquidado,
      SUM(valor_pago) AS soma_pago,
      COUNT(politico_id) AS com_politico,
      COUNT(*) - COUNT(politico_id) AS sem_politico
    FROM emendas
  `);
  console.log(resTotais.rows[0]);

  // 2. Por Ano
  console.log('\n=== DISTRIBUIÇÃO POR ANO ===');
  const resAno = await client.query(`
    SELECT ano, COUNT(*) as qtd, SUM(valor_pago) as valor_pago
    FROM emendas
    GROUP BY ano
    ORDER BY ano DESC
  `);
  console.log(resAno.rows);

  // 3. Por Tipo de Emenda
  console.log('\n=== DISTRIBUIÇÃO POR TIPO DE EMENDA ===');
  const resTipo = await client.query(`
    SELECT tipo_emenda, COUNT(*) as qtd, SUM(valor_pago) as valor_pago
    FROM emendas
    GROUP BY tipo_emenda
    ORDER BY valor_pago DESC
  `);
  console.log(resTipo.rows);

  // 4. Por Função (Saúde, Educação, etc.)
  console.log('\n=== DISTRIBUIÇÃO POR FUNÇÃO (TOP 10) ===');
  const resFuncao = await client.query(`
    SELECT funcao, COUNT(*) as qtd, SUM(valor_pago) as valor_pago
    FROM emendas
    GROUP BY funcao
    ORDER BY valor_pago DESC
    LIMIT 10
  `);
  console.log(resFuncao.rows);

  // 5. Exemplo de Registro Completo de Emenda
  console.log('\n=== EXEMPLO DE EMENDA COMPLETA ===');
  const resExemplo = await client.query(`
    SELECT * FROM emendas 
    WHERE politico_id IS NOT NULL 
    LIMIT 1
  `);
  console.log(JSON.stringify(resExemplo.rows[0], null, 2));

  // 6. Verificar se há alguma tabela que possa conter dados de emendas estaduais
  console.log('\n=== LISTA DE TABELAS DO BANCO ===');
  const resTabelas = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log(resTabelas.rows.map(r => r.table_name).join(', '));

  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
