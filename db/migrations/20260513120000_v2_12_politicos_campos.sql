-- Migration v2.12 — Campos do gabinete e dados pessoais
-- Adicionar colunas novas na tabela politicos

ALTER TABLE politicos
  ADD COLUMN IF NOT EXISTS uf_nascimento    char(2),
  ADD COLUMN IF NOT EXISTS sexo             text,
  ADD COLUMN IF NOT EXISTS data_falecimento date,
  ADD COLUMN IF NOT EXISTS gabinete_nome    text,
  ADD COLUMN IF NOT EXISTS gabinete_telefone text,
  ADD COLUMN IF NOT EXISTS gabinete_email   text;

-- Comentários
COMMENT ON COLUMN politicos.uf_nascimento    IS 'ufNascimento (Câmara)';
COMMENT ON COLUMN politicos.sexo             IS 'sexo: M | F (Câmara)';
COMMENT ON COLUMN politicos.data_falecimento IS 'dataFalecimento (Câmara) — null se vivo';
COMMENT ON COLUMN politicos.gabinete_nome    IS 'ultimoStatus.gabinete.nome (Câmara)';
COMMENT ON COLUMN politicos.gabinete_telefone IS 'ultimoStatus.gabinete.telefone (Câmara)';
COMMENT ON COLUMN politicos.gabinete_email   IS 'ultimoStatus.gabinete.email (Câmara)';
