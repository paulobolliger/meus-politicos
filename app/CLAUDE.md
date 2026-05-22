@AGENTS.md

## ⚠️ REGRA CRÍTICA — ETL e dados do banco

**SEMPRE consulte o banco antes de mandar rodar qualquer ETL.**

```sql
SELECT source_id, COUNT(*) as registros, MIN(ano) as ano_min, MAX(ano) as ano_max
FROM gastos GROUP BY source_id;

SELECT source_id, COUNT(*) FROM votacoes GROUP BY source_id;
SELECT COUNT(*) FROM emendas;
SELECT COUNT(*) FROM proposicoes;
SELECT COUNT(*) FROM politicos WHERE cargo = 'senador';
```

### Status dos dados coletados (atualizar sempre que rodar ETL)

| Tabela | Fonte | Registros | Período | Última coleta |
|--------|-------|-----------|---------|---------------|
| `gastos` | `camara_ceap` | ~527k | 2022–2025 | Mai/2026 |
| `gastos` | `senado_ceaps` | ~40k | 2023–2026 | Mai/2026 |
| `votacoes` | `camara_votos_bulk` | ~379k | 2023–2025 | Mai/2026 |
| `votacoes` | `senado_legis` | ~13k | até mai/2026 | Mai/2026 |
| `emendas` | `portal_transparencia` | ~16.6k | 2024–2025 | Mai/2026 |
| `proposicoes` | `camara_dadosabertos` | ~57k | até mai/2026 | Mai/2026 |
| `politicos` | `camara_deputados` | 513 dep. federais | — | Mai/2026 |
| `politicos` | `senado_legis` | 81 senadores | — | Mai/2026 |

### ETLs ainda pendentes (ainda não rodados)
- `collect_camara_gastos.py --ano 2026` (2026 da Câmara falta)
- `collect_senadores.py` (re-rodar para pegar mandato_inicio — foi corrigido)
- `populate_siafi.py` (re-rodar após novos senadores)

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

## Contrato de dados de back office

Para status de campo, fallback e exibicao de dados cadastrais do perfil
(fora das regras especificas de score), leia obrigatoriamente:

`docs/BACKOFFICE_DATA_CONTRACT.md`

Nao duplicar regras de fallback em CLAUDE.md; este arquivo deve apenas
referenciar o contrato oficial em docs.

## Arquitetura de subdomínios (refactor/civic-terminal)

O projeto usa route groups para servir dois produtos do mesmo deploy:

- `(site)/` -> meuspoliticos.com.br - site publico, linguagem cidadao
- `(app)/` -> app.meuspoliticos.com.br - app analitico, linguagem tecnica
- `(auth)/` -> compartilhado entre os dois

Diferenciacao por host e feita no `proxy.ts`.
Cookie Supabase: dominio `.meuspoliticos.com.br` em producao.

Componentes civicos: `src/components/civic/` - usar sempre antes de criar novo componente visual.
Tokens: ver `src/app/globals.css` secao `:root`.
