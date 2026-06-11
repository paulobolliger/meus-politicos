-- Migration: Deduplicação de municípios e criação da tabela municipios_financas (dados SICONFI)
-- Date: 2026-06-06

-- 1. Deduplicação de municípios e criação de constraints para integridade
DELETE FROM public.municipios a
USING public.municipios b
WHERE a.ctid > b.ctid
  AND a.codigo_ibge = b.codigo_ibge;

-- Garantir que a tabela municipios possui chave primária e unique constraint em codigo_ibge
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'municipios' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.municipios ADD PRIMARY KEY (id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'municipios' AND constraint_name = 'uq_municipios_codigo_ibge'
    ) THEN
        ALTER TABLE public.municipios ADD CONSTRAINT uq_municipios_codigo_ibge UNIQUE (codigo_ibge);
    END IF;
END $$;


-- 2. Criação da tabela municipios_financas
CREATE TABLE IF NOT EXISTS public.municipios_financas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_ibge INTEGER NOT NULL REFERENCES public.municipios(codigo_ibge) ON DELETE CASCADE,
    ano INTEGER NOT NULL,
    receitas_realizadas NUMERIC(16,2) NOT NULL,
    despesas_liquidadas NUMERIC(16,2) NOT NULL,
    resultado_orcamentario NUMERIC(16,2) NOT NULL,
    situacao VARCHAR(20) NOT NULL CHECK (situacao IN ('deficitario', 'superavitario')),
    source_id VARCHAR(50) DEFAULT 'siconfi_dca',
    coletado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_municipios_financas_mun_ano UNIQUE (municipio_ibge, ano)
);

-- 3. Índices de busca
CREATE INDEX IF NOT EXISTS idx_mun_financas_mun ON public.municipios_financas(municipio_ibge);
CREATE INDEX IF NOT EXISTS idx_mun_financas_ano ON public.municipios_financas(ano);
CREATE INDEX IF NOT EXISTS idx_mun_financas_situacao ON public.municipios_financas(situacao);

-- 4. Trigger set_atualizado_em
DROP TRIGGER IF EXISTS set_atualizado_em_municipios_financas ON public.municipios_financas;
CREATE TRIGGER set_atualizado_em_municipios_financas
    BEFORE UPDATE ON public.municipios_financas
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- 5. Segurança: RLS, Grants e Policies
ALTER TABLE public.municipios_financas ENABLE ROW LEVEL SECURITY;

-- Grant SELECT conditionally if anon role exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT SELECT ON TABLE public.municipios_financas TO anon, authenticated, service_role;
    END IF;
END $$;

DROP POLICY IF EXISTS municipios_financas_select_public ON public.municipios_financas;
CREATE POLICY municipios_financas_select_public
    ON public.municipios_financas FOR SELECT USING (true);
