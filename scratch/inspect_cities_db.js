const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', 'app', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('Arquivo .env.local não encontrado! Caminho:', envPath);
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
  env[key] = val;
});

const config = {
  host: env.POSTGRES_HOST || 'localhost',
  port: parseInt(env.POSTGRES_PORT || '5432', 10),
  database: env.POSTGRES_DB || 'meuspoliticos_db',
  user: env.POSTGRES_USER || 'postgres',
  password: env.POSTGRES_PASSWORD || '',
};

const client = new Client(config);

async function run() {
  await client.connect();
  console.log('Conectado!');

  // 1. Cargos em politicos
  const cargos = await client.query(`
    SELECT cargo, COUNT(*) as total
    FROM politicos
    GROUP BY cargo
    ORDER BY total DESC
  `);
  console.log('--- CARGOS NA TABELA politicos ---');
  console.table(cargos.rows);

  // 2. Colunas da tabela politicos
  const politicosColumns = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'politicos'
    ORDER BY ordinal_position
  `);
  console.log('\n--- COLUNAS DE politicos ---');
  console.log(politicosColumns.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  // 3. Colunas da tabela municipios
  const municipiosColumns = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'municipios'
    ORDER BY ordinal_position
  `);
  console.log('\n--- COLUNAS DE municipios ---');
  console.log(municipiosColumns.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  // 4. Se tiver prefeitos ou vereadores, ver alguns exemplos
  const pref = await client.query(`
    SELECT id, nome, cargo, uf, municipio_id
    FROM politicos
    WHERE cargo IN ('prefeito', 'vereador')
    LIMIT 5
  `);
  console.log('\n--- AMOSTRA PREFEITO/VEREADOR ---');
  console.log(pref.rows);

  // 5. Quais tabelas temos ligadas a finanças municipais ou siconfi?
  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND (table_name LIKE '%siconfi%' OR table_name LIKE '%financas%' OR table_name LIKE '%receita%' OR table_name LIKE '%despesa%')
  `);
  console.log('\n--- TABELAS DE FINANÇAS/SICONFI ---');
  console.log(tables.rows.map(t => t.table_name));

  // 6. Vamos ver todas as tabelas no banco de dados para ter certeza
  const allTables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log('\n--- TODAS AS TABELAS ---');
  console.log(allTables.rows.map(t => t.table_name).join(', '));

  await client.end();
}

run().catch(console.error);
