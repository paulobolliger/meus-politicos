-- Popula politico_id em proposicao_autores por match de nome_eleitoral (case-insensitive)
-- Usa SET row_security = off pois a tabela tem RLS com apenas policy SELECT.
-- DISTINCT ON elimina ambiguidade quando o mesmo nome pertence a 2 políticos.

SET row_security = off;

-- Match principal: nome_eleitoral exato (case-insensitive)
UPDATE proposicao_autores pa
SET politico_id = pol.id
FROM (
  SELECT DISTINCT ON (LOWER(nome_eleitoral)) id, nome_eleitoral
  FROM politicos
  WHERE removido_em IS NULL
  ORDER BY LOWER(nome_eleitoral)
) pol
WHERE pa.politico_id IS NULL
  AND LOWER(pol.nome_eleitoral) = LOWER(pa.nome);

-- Match adicional para autores no formato "Senado Federal - Nome do Senador"
UPDATE proposicao_autores pa
SET politico_id = pol.id
FROM (
  SELECT DISTINCT ON (LOWER(nome_eleitoral)) id, nome_eleitoral
  FROM politicos
  WHERE cargo = 'senador' AND removido_em IS NULL
  ORDER BY LOWER(nome_eleitoral)
) pol
WHERE pa.politico_id IS NULL
  AND pa.nome LIKE 'Senado Federal - %'
  AND LOWER(pol.nome_eleitoral) = LOWER(TRIM(SUBSTRING(pa.nome FROM POSITION(' - ' IN pa.nome) + 3)));

SET row_security = on;

-- Verificação
SELECT
  COUNT(*) as total,
  COUNT(politico_id) as com_match,
  COUNT(*) - COUNT(politico_id) as sem_match,
  ROUND(COUNT(politico_id)::numeric / COUNT(*) * 100, 1) as pct_match
FROM proposicao_autores;
