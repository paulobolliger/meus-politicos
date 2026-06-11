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

  // Check constraints on politicos table
  const constraints = await client.query(`
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'politicos'::regclass
  `);
  console.log('--- CONSTRAINTS ON politicos ---');
  console.log(constraints.rows);

  // Check the data types of 'cargo' and 'situacao' in politicos
  const types = await client.query(`
    SELECT typname, enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE typname IN ('cargo_tipo', 'situacao_tipo', 'cargo', 'situacao')
  `);
  console.log('\n--- ENUM TYPES ---');
  console.table(types.rows);

  await client.end();
}

run().catch(console.error);
