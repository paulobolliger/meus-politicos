-- Fila persistente para orquestracao segura de ETLs fora do runtime web.

CREATE TABLE IF NOT EXISTS etl_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte text NOT NULL,
  parametros jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_andamento', 'ok', 'falhou', 'cancelado')),
  prioridade integer NOT NULL DEFAULT 100,
  tentativas integer NOT NULL DEFAULT 0,
  max_tentativas integer NOT NULL DEFAULT 2,
  solicitado_por text NOT NULL DEFAULT 'n8n',
  runner_id text,
  exit_code integer,
  mensagem text,
  stdout_resumo text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  disponivel_em timestamptz NOT NULL DEFAULT now(),
  iniciado_em timestamptz,
  concluido_em timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etl_jobs_claim
  ON etl_jobs (status, disponivel_em, prioridade, criado_em);

CREATE UNIQUE INDEX IF NOT EXISTS idx_etl_jobs_single_active_source
  ON etl_jobs (fonte)
  WHERE status IN ('pendente', 'em_andamento');

ALTER TABLE etl_jobs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE etl_jobs IS
  'Fila de ETLs. A aplicacao web enfileira; runner externo executa scripts Python.';
