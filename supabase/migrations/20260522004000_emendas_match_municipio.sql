-- Popula municipio_ibge nas emendas que têm municipio_nome + uf_municipio
-- Faz o match por UPPER(municipios.nome) = emendas.municipio_nome AND municipios.uf = emendas.uf_municipio
-- Emendas com municipio_nome sendo um estado (uf_municipio IS NULL) são ignoradas intencionalmente.

UPDATE emendas e
SET municipio_ibge = m.codigo_ibge::text,
    atualizado_em  = now()
FROM municipios m
WHERE e.municipio_ibge IS NULL
  AND e.uf_municipio IS NOT NULL
  AND UPPER(m.nome) = e.municipio_nome
  AND m.uf = e.uf_municipio;

-- Verificação
SELECT
  COUNT(*) FILTER (WHERE municipio_ibge IS NOT NULL) AS com_ibge,
  COUNT(*) FILTER (WHERE municipio_ibge IS NULL AND uf_municipio IS NOT NULL) AS sem_ibge_mas_tem_uf,
  COUNT(*) FILTER (WHERE municipio_ibge IS NULL AND uf_municipio IS NULL) AS sem_uf_estado
FROM emendas;
