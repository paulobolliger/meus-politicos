const fs = require('fs');
const { Client } = require('c:/Users/paulo/0-dev/02-aplicacoes/05 meus-politicos/node_modules/pg');

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

  console.log('\n--- TOP 10 MAIORES GASTOS CEAP ---');
  const resGastos = await client.query(`
    SELECT p.nome, p.nome_eleitoral, p.cargo, p.uf, p.gasto_total_ano, pt.sigla AS partido_sigla
    FROM politicos p
    LEFT JOIN partidos pt ON pt.id = p.partido_id
    WHERE p.gasto_total_ano IS NOT NULL
    ORDER BY p.gasto_total_ano DESC
    LIMIT 10
  `);
  resGastos.rows.forEach((r, i) => {
    console.log(`${i+1}. ${r.nome_eleitoral || r.nome} (${r.partido_sigla}-${r.uf}) - Cargo: ${r.cargo} - Gasto: R$ ${Number(r.gasto_total_ano).toLocaleString('pt-BR')}`);
  });

  console.log('\n--- TOP 10 MAIOR ASSIDUIDADE ---');
  const resPresenca = await client.query(`
    SELECT p.nome, p.nome_eleitoral, p.cargo, p.uf, p.presenca_pct_atual, pt.sigla AS partido_sigla
    FROM politicos p
    LEFT JOIN partidos pt ON pt.id = p.partido_id
    WHERE p.presenca_pct_atual IS NOT NULL
    ORDER BY p.presenca_pct_atual DESC
    LIMIT 10
  `);
  resPresenca.rows.forEach((r, i) => {
    console.log(`${i+1}. ${r.nome_eleitoral || r.nome} (${r.partido_sigla}-${r.uf}) - Cargo: ${r.cargo} - Presença: ${Number(r.presenca_pct_atual).toFixed(1)}%`);
  });

  await client.end();
}

run().catch(console.error);
