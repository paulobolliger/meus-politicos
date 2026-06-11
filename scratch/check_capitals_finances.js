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

  const finances = await client.query(`
    SELECT municipio_ibge, ano, receitas_realizadas, despesas_liquidadas, resultado_orcamentario, situacao
    FROM municipios_financas
    WHERE municipio_ibge IN (1200401, 3304557, 3550308)
  `);
  console.log('--- CAPITAL FINANCES ---');
  console.log(finances.rows);

  await client.end();
}

run().catch(console.error);
