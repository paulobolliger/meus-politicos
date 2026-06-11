const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', 'app', '.env.local');

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

  // 1. Contagem de municipios
  const munCount = await client.query('SELECT COUNT(*) FROM municipios');
  console.log(`Total de municipios: ${munCount.rows[0].count}`);

  // 2. Alguns exemplos de municipios com população e pib
  const munSample = await client.query(`
    SELECT id, codigo_ibge, nome, uf, slug, populacao, pib, pib_per_capita
    FROM municipios
    WHERE populacao IS NOT NULL
    ORDER BY populacao DESC
    LIMIT 5
  `);
  console.log('\n--- AMOSTRA DE MUNICIPIOS COM MAIOR POPULACAO ---');
  console.table(munSample.rows);

  // 3. Contagem de municipios_financas
  const finCount = await client.query('SELECT COUNT(*) FROM municipios_financas');
  console.log(`\nTotal de registros em municipios_financas: ${finCount.rows[0].count}`);

  // 4. Amostra de municipios_financas
  if (parseInt(finCount.rows[0].count, 10) > 0) {
    const finSample = await client.query(`
      SELECT *
      FROM municipios_financas
      LIMIT 3
    `);
    console.log('\n--- AMOSTRA DE municipios_financas ---');
    console.log(JSON.stringify(finSample.rows, null, 2));
  }

  await client.end();
}

run().catch(console.error);
