-- Histórico de Fundo Partidário (FP) e Fundo Eleitoral (FEFC) por partido.
CREATE TABLE IF NOT EXISTS public.partidos_fundos (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    partido_id  uuid NOT NULL REFERENCES public.partidos(id) ON DELETE CASCADE,
    tipo        text NOT NULL CHECK (tipo IN ('fp', 'fefc')),
    ano         integer NOT NULL CHECK (ano >= 1995),
    valor       numeric(18,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
    coletado_em timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_partidos_fundos_partido_tipo_ano UNIQUE (partido_id, tipo, ano)
);

CREATE INDEX IF NOT EXISTS idx_partidos_fundos_ano
    ON public.partidos_fundos (ano);

CREATE INDEX IF NOT EXISTS idx_partidos_fundos_partido
    ON public.partidos_fundos (partido_id);

ALTER TABLE public.partidos
    ADD COLUMN IF NOT EXISTS fp_ultimo_valor numeric(18,2),
    ADD COLUMN IF NOT EXISTS fp_ultimo_ano integer,
    ADD COLUMN IF NOT EXISTS fefc_ultimo_valor numeric(18,2),
    ADD COLUMN IF NOT EXISTS fefc_ultimo_ano integer;
