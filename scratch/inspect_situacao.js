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

  const situacaoVals = await client.query('SELECT DISTINCT situacao FROM politicos');
  console.log('--- SITUACAO IN politicos ---');
  console.table(situacaoVals.rows);

  const enumDetails = await client.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    ORDER BY t.typname, e.enumsortorder
  `);
  console.log('\n--- ALL ENUMS ---');
  console.table(enumDetails.rows.filter(r => r.typname.includes('situacao') || r.typname.includes('cargo')));

  await client.end();
}

run().catch(console.error);
