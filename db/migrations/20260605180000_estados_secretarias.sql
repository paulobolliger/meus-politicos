-- Migration: Criação da tabela de secretarias estaduais
-- Date: 2026-06-05

CREATE TABLE IF NOT EXISTS estados_secretarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sigla VARCHAR(2) NOT NULL REFERENCES estados_info(sigla) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    secretario_nome VARCHAR(255) NOT NULL,
    competencia TEXT,
    endereco VARCHAR(500),
    site_oficial VARCHAR(255),
    email VARCHAR(255),
    telefone VARCHAR(100),
    foto_secretario_url VARCHAR(500),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sigla_nome_secretaria UNIQUE (sigla, nome)
);
