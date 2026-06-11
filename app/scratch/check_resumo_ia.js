const fs = require('fs');
const { Client } = require('pg');

const envPath = 'c:/Users/paulo/0-dev/02-aplicacoes/05 meus-politicos/app/.env.local';
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

const client = new Client({
  host: env.POSTGRES_HOST || 'localhost',
  port: parseInt(env.POSTGRES_PORT || '5432', 10),
  database: env.POSTGRES_DB || 'meuspoliticos_db',
  user: env.POSTGRES_USER || 'postgres',
  password: env.POSTGRES_PASSWORD || '',
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'votacoes'
    ORDER BY column_name ASC
  `);
  res.rows.forEach(r => {
    console.log(`- ${r.column_name} (${r.data_type}) - Nullable: ${r.is_nullable}`);
  });
  await client.end();
}
run();
