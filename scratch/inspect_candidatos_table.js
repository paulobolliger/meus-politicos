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

  // 1. Cargos em candidaturas_historico
  const cargosHist = await client.query(`
    SELECT cargo, COUNT(*) as total
    FROM candidaturas_historico
    GROUP BY cargo
    ORDER BY total DESC
  `);
  console.log('--- CARGOS EM candidaturas_historico ---');
  console.table(cargosHist.rows);

  // 2. Anos em candidaturas_historico
  const anosHist = await client.query(`
    SELECT eleicao_ano, COUNT(*) as total
    FROM candidaturas_historico
    GROUP BY eleicao_ano
    ORDER BY eleicao_ano DESC
  `);
  console.log('\n--- ANOS EM candidaturas_historico ---');
  console.table(anosHist.rows);

  // 3. Resultados em candidaturas_historico
  const resHist = await client.query(`
    SELECT resultado, COUNT(*) as total
    FROM candidaturas_historico
    GROUP BY resultado
    ORDER BY total DESC
  `);
  console.log('\n--- RESULTADOS EM candidaturas_historico ---');
  console.table(resHist.rows);

  // 4. Se tivermos 'prefeito' ou 'vereador' eleitos em algum ano, ver se estão associados a politicos
  const eleitos = await client.query(`
    SELECT c.cargo, c.eleicao_ano, COUNT(p.id) as com_politico, COUNT(*) as total
    FROM candidaturas_historico c
    LEFT JOIN politicos p ON c.politico_id = p.id
    GROUP BY c.cargo, c.eleicao_ano
    ORDER BY c.eleicao_ano DESC, c.cargo
  `);
  console.log('\n--- CANDIDATURAS ELEITAS E VINCULO COM politicos ---');
  console.table(eleitos.rows);

  await client.end();
}

run().catch(console.error);
