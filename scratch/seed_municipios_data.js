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

  // Get party mapping
  const partiesRes = await client.query('SELECT id, sigla FROM partidos');
  const parties = {};
  partiesRes.rows.forEach(r => {
    parties[r.sigla] = r.id;
  });
  console.log('Partidos carregados:', Object.keys(parties).join(', '));

  // Capitals data
  const SP_ID = 'e8f64cf8-f9f0-4392-be0c-a2b8d6daf671';
  const RJ_ID = 'c43edb63-60e1-4f91-86a8-db41bee35e56';
  const AC_ID = '73c1d886-83be-4ff5-b72d-185cd8b3512a';

  // 1. Update PIB/PIB per capita in municipios
  console.log('Atualizando PIB dos municípios...');
  await client.query(`
    UPDATE municipios 
    SET pib = 828981, pib_per_capita = 69600, area_km2 = 1521.11, densidade_demografica = 7820
    WHERE id = $1
  `, [SP_ID]);

  await client.query(`
    UPDATE municipios 
    SET pib = 354563, pib_per_capita = 52700, area_km2 = 1200.27, densidade_demografica = 5600
    WHERE id = $1
  `, [RJ_ID]);

  await client.query(`
    UPDATE municipios 
    SET pib = 10425, pib_per_capita = 28600, area_km2 = 8838.61, densidade_demografica = 41
    WHERE id = $1
  `, [AC_ID]);

  // Clean existing prefeitos/vereadores for these cities (idempotent seed)
  console.log('Limpando prefeitos e vereadores existentes para as capitais...');
  await client.query(`
    DELETE FROM politicos 
    WHERE municipio_id IN ($1, $2, $3) AND cargo IN ('prefeito', 'vereador')
  `, [SP_ID, RJ_ID, AC_ID]);

  // 2. Insert Prefeitos
  console.log('Inserindo prefeitos...');
  
  // SP: Ricardo Nunes (MDB)
  await client.query(`
    INSERT INTO politicos (
      id, nome, nome_civil, slug, partido_id, uf, cargo, situacao, 
      mandato_inicio, mandato_fim, numero_mandato, foto_url, 
      email, nome_eleitoral, data_nascimento, naturalidade, 
      escolaridade, ocupacao, municipio_id, presenca_pct_atual, 
      gasto_total_ano, total_votacoes, source_id, collected_at, criado_em, atualizado_em
    ) VALUES (
      gen_random_uuid(), 'Ricardo Luis Reis Nunes', 'Ricardo Nunes', 'ricardo-nunes-sp', $1, 'SP', 'prefeito', 'ativo',
      '2025-01-01', '2028-12-31', 2, 'https://res.cloudinary.com/dhqvjxgue/image/upload/v1780710600/meus-politicos/politicos/executivo/ricardo-nunes.jpg',
      'ricardonunes@prefeitura.sp.gov.br', 'RICARDO NUNES', '1967-11-13', 'São Paulo',
      'Superior Completo', 'Empresário', $2, 100, 0, 0, 'seed', now(), now(), now()
    )
  `, [parties['MDB'], SP_ID]);

  // RJ: Eduardo Paes (PSD)
  await client.query(`
    INSERT INTO politicos (
      id, nome, nome_civil, slug, partido_id, uf, cargo, situacao, 
      mandato_inicio, mandato_fim, numero_mandato, foto_url, 
      email, nome_eleitoral, data_nascimento, naturalidade, 
      escolaridade, ocupacao, municipio_id, presenca_pct_atual, 
      gasto_total_ano, total_votacoes, source_id, collected_at, criado_em, atualizado_em
    ) VALUES (
      gen_random_uuid(), 'Eduardo da Costa Paes', 'Eduardo Paes', 'eduardo-paes-rj', $1, 'RJ', 'prefeito', 'ativo',
      '2025-01-01', '2028-12-31', 4, 'https://res.cloudinary.com/dhqvjxgue/image/upload/v1780710600/meus-politicos/politicos/executivo/eduardo-paes.jpg',
      'eduardopaes@prefeitura.rio', 'EDUARDO PAES', '1969-11-14', 'Rio de Janeiro',
      'Superior Completo', 'Advogado', $2, 100, 0, 0, 'seed', now(), now(), now()
    )
  `, [parties['PSD'], RJ_ID]);

  // AC: Tião Bocalom (PL)
  await client.query(`
    INSERT INTO politicos (
      id, nome, nome_civil, slug, partido_id, uf, cargo, situacao, 
      mandato_inicio, mandato_fim, numero_mandato, foto_url, 
      email, nome_eleitoral, data_nascimento, naturalidade, 
      escolaridade, ocupacao, municipio_id, presenca_pct_atual, 
      gasto_total_ano, total_votacoes, source_id, collected_at, criado_em, atualizado_em
    ) VALUES (
      gen_random_uuid(), 'Sebastião Bocalom Rodrigues', 'Sebastião Bocalom', 'tiao-bocalom-ac', $1, 'AC', 'prefeito', 'ativo',
      '2025-01-01', '2028-12-31', 2, 'https://res.cloudinary.com/dhqvjxgue/image/upload/v1780710600/meus-politicos/politicos/executivo/tiao-bocalom.jpg',
      'tiaobocalom@riobranco.ac.gov.br', 'TIÃO BOCALOM', '1953-05-18', 'Bela Vista do Paraíso',
      'Superior Completo', 'Agrônomo', $2, 100, 0, 0, 'seed', now(), now(), now()
    )
  `, [parties['PL'], AC_ID]);

  // 3. Insert Vereadores
  console.log('Inserindo vereadores de São Paulo...');
  const vereadoresSP = [
    { nome: 'Lucas Pavanato', partido: 'PL', slug: 'lucas-pavanato-sp', escolaridade: 'Superior Incompleto', ocupacao: 'Outros' },
    { nome: 'Amanda Paschoal', partido: 'PSOL', slug: 'amanda-paschoal-sp', escolaridade: 'Superior Completo', ocupacao: 'Advogada' },
    { nome: 'Rubinho Nunes', partido: 'UNIÃO', slug: 'rubinho-nunes-sp', escolaridade: 'Superior Completo', ocupacao: 'Advogado' },
    { nome: 'Cris Monteiro', partido: 'NOVO', slug: 'cris-monteiro-sp', escolaridade: 'Superior Completo', ocupacao: 'Administradora' },
    { nome: 'Marina Bragante', partido: 'REDE', slug: 'marina-bragante-sp', escolaridade: 'Superior Completo', ocupacao: 'Gestora Pública' },
    { nome: 'Alessandro Guedes', partido: 'PT', slug: 'alessandro-guedes-sp', escolaridade: 'Superior Completo', ocupacao: 'Sociólogo' },
    { nome: 'Milton Leite', partido: 'UNIÃO', slug: 'milton-leite-sp', escolaridade: 'Ensino Médio', ocupacao: 'Empresário' },
    { nome: 'Adilson Amadeu', partido: 'UNIÃO', slug: 'adilson-amadeu-sp', escolaridade: 'Superior Completo', ocupacao: 'Empresário' },
  ];

  for (const v of vereadoresSP) {
    const email = `${v.slug}@camara.sp.gov.br`;
    await client.query(`
      INSERT INTO politicos (
        id, nome, nome_civil, slug, partido_id, uf, cargo, situacao, 
        mandato_inicio, mandato_fim, numero_mandato, foto_url, 
        email, nome_eleitoral, data_nascimento, naturalidade, 
        escolaridade, ocupacao, municipio_id, presenca_pct_atual, 
        gasto_total_ano, total_votacoes, source_id, collected_at, criado_em, atualizado_em
      ) VALUES (
        gen_random_uuid(), $1, $1, $2, $3, 'SP', 'vereador', 'ativo',
        '2025-01-01', '2028-12-31', 1, null,
        $4, $1, '1985-05-10', 'São Paulo',
        $5, $6, $7, 95.5, 45000, 150, 'seed', now(), now(), now()
      )
    `, [v.nome, v.slug, parties[v.partido], email, v.escolaridade, v.ocupacao, SP_ID]);
  }

  console.log('Inserindo vereadores do Rio de Janeiro...');
  const vereadoresRJ = [
    { nome: 'Carlos Bolsonaro', partido: 'PL', slug: 'carlos-bolsonaro-rj', escolaridade: 'Superior Completo', ocupacao: 'Vereador' },
    { nome: 'Monica Benicio', partido: 'PSOL', slug: 'monica-benicio-rj', escolaridade: 'Superior Completo', ocupacao: 'Arquiteta' },
    { nome: 'Carlo Caiado', partido: 'PSD', slug: 'carlo-caiado-rj', escolaridade: 'Superior Completo', ocupacao: 'Administrador' },
    { nome: 'Tainá de Paula', partido: 'PT', slug: 'taina-de-paula-rj', escolaridade: 'Superior Completo', ocupacao: 'Arquiteta' },
    { nome: 'Pedro Duarte', partido: 'NOVO', slug: 'pedro-duarte-rj', escolaridade: 'Superior Completo', ocupacao: 'Advogado' },
  ];

  for (const v of vereadoresRJ) {
    const email = `${v.slug}@camara.rio.gov.br`;
    await client.query(`
      INSERT INTO politicos (
        id, nome, nome_civil, slug, partido_id, uf, cargo, situacao, 
        mandato_inicio, mandato_fim, numero_mandato, foto_url, 
        email, nome_eleitoral, data_nascimento, naturalidade, 
        escolaridade, ocupacao, municipio_id, presenca_pct_atual, 
        gasto_total_ano, total_votacoes, source_id, collected_at, criado_em, atualizado_em
      ) VALUES (
        gen_random_uuid(), $1, $1, $2, $3, 'RJ', 'vereador', 'ativo',
        '2025-01-01', '2028-12-31', 1, null,
        $4, $1, '1982-12-07', 'Rio de Janeiro',
        $5, $6, $7, 92.3, 38000, 110, 'seed', now(), now(), now()
      )
    `, [v.nome, v.slug, parties[v.partido], email, v.escolaridade, v.ocupacao, RJ_ID]);
  }

  console.log('Inserindo vereadores de Rio Branco...');
  const vereadoresAC = [
    { nome: 'Samir Bestene', partido: 'PP', slug: 'samir-bestene-ac', escolaridade: 'Superior Completo', ocupacao: 'Empresário' },
    { nome: 'João Marcos Luz', partido: 'PL', slug: 'joao-marcos-luz-ac', escolaridade: 'Superior Completo', ocupacao: 'Advogado' },
    { nome: 'N. Lima', partido: 'PP', slug: 'n-lima-ac', escolaridade: 'Ensino Médio', ocupacao: 'Outros' },
  ];

  for (const v of vereadoresAC) {
    const email = `${v.slug}@riobranco.ac.leg.br`;
    await client.query(`
      INSERT INTO politicos (
        id, nome, nome_civil, slug, partido_id, uf, cargo, situacao, 
        mandato_inicio, mandato_fim, numero_mandato, foto_url, 
        email, nome_eleitoral, data_nascimento, naturalidade, 
        escolaridade, ocupacao, municipio_id, presenca_pct_atual, 
        gasto_total_ano, total_votacoes, source_id, collected_at, criado_em, atualizado_em
      ) VALUES (
        gen_random_uuid(), $1, $1, $2, $3, 'AC', 'vereador', 'ativo',
        '2025-01-01', '2028-12-31', 1, null,
        $4, $1, '1978-04-15', 'Rio Branco',
        $5, $6, $7, 88.0, 12000, 95, 'seed', now(), now(), now()
      )
    `, [v.nome, v.slug, parties[v.partido], email, v.escolaridade, v.ocupacao, AC_ID]);
  }

  console.log('Seed de prefeitos e vereadores concluído com sucesso!');
  await client.end();
}

run().catch(console.error);
