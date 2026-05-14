<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Métricas e scores de políticos

Antes de criar qualquer componente que exiba métricas, scores, comparativos
ou indicadores de políticos, leia obrigatoriamente:

`docs/METRICS.md` — metodologia completa com fórmulas, regras de exibição,
cores padrão e disclaimers obrigatórios.

Regras resumidas:
- Nunca exibir score sem contexto de benchmark (comparar com peers da mesma UF/partido)
- Dados indisponívels → exibir "–" com tooltip "Dados sendo coletados"
- Disclaimer obrigatório em toda página com scores (ver METRICS.md)
- Cores: verde ≥+10% da média · âmbar ±10% · vermelho ≤-10% · cinza sem dados
