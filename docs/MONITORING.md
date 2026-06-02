---
file: docs/MONITORING.md
module: Monitoring & Observability
status: Active
related: [docs/SECURITY.md, docs/GAP_ANALYSIS.md, docs/DEPLOYMENT.md]
---

# Monitoramento e Observabilidade — Meus Políticos

> ⚠️ **Gap G-14 (P2):** O projeto **não possui** monitoramento de erros de runtime em produção. Erros que ocorrem em produção não geram alertas — são invisíveis para a equipe até que um usuário reporte manualmente.

---

## 1. Estado atual do monitoramento

| Aspecto | Status | Ferramenta |
|---|---|---|
| Erros de runtime (frontend) | ❌ Sem monitoramento | — |
| Erros de runtime (API Routes) | ❌ Apenas `console.error` | Logs da Vercel (não persistidos) |
| Erros de ETL Python | ❌ Apenas `print` / `logging` local | — |
| Status de coletas ETL | ✅ Parcial | Tabela `coletas_log` + view `/admin` |
| Uptime do banco | ❌ Sem alerta | — |
| Performance de queries | ❌ Sem rastreamento | — |
| Analytics de uso | ✅ Parcial | Tabela `analytics_eventos` + `/admin/analytics` |
| Logs de ações admin | ✅ Ativo | Tabela `admin_logs` |

---

## 2. O que existe hoje

### 2.1 Tabela `coletas_log` — status dos ETLs

Cada execução de ETL deve inserir um registro em `coletas_log`:

```sql
INSERT INTO coletas_log (fonte, tipo, status, registros, erros, duracao_ms, mensagem)
VALUES ('camara_deputados', 'votacoes', 'ok', 1234, 0, 45000, 'Coleta concluída')
```

**View `ultima_coleta_por_fonte`:** agrega o status mais recente por fonte e tipo. Exibida em `/admin` e (futuramente) em `/status` público.

**Limitação:** os ETLs precisam escrever ativamente nesta tabela. Se o script travar ou for encerrado abruptamente sem INSERT de conclusão, o registro fica em `em_andamento` indefinidamente — não há timeout automático.

### 2.2 Tabela `admin_logs` — auditoria de ações

Registra ações realizadas pelo painel `/admin`:

```sql
-- Exemplo: admin atualizou feature flag
INSERT INTO admin_logs (usuario_id, acao, entidade, entidade_id, detalhe)
VALUES (uuid, 'atualizar_feature_flag', 'feature_flags', 'candidatos_2026', {ativo: true})
```

### 2.3 Tabela `analytics_eventos` — eventos de uso

Registra eventos de navegação e uso via `/api/analytics` (POST, público):

```sql
INSERT INTO analytics_eventos (tipo, payload, usuario_id)
VALUES ('page_view', {path: '/estado/SP'}, null)
```

Exibido em `/admin/analytics`.

### 2.4 Logs Vercel

A Vercel captura `console.log`, `console.error` e `console.warn` das API Routes e Server Components. Acessíveis em:

- Vercel Dashboard → Project → Functions → Logs (retidos por 1 dia no plano free)
- **Problema:** logs não são persistidos nem alertados — apenas consultáveis manualmente

### 2.5 `console.error` nos webhooks

Os webhooks de pagamento logam erros e confirmações:

```typescript
// stripe/route.ts
console.error('[Stripe Webhook] Assinatura inválida:', err)
console.log('[Stripe] Pagamento confirmado:', { id, amount, tipo, nome, email })

// infinitepay/route.ts
console.error('[Webhook InfinitePay] Erro:', err)
console.log('[Webhook InfinitePay] Pagamento confirmado:', { order_nsu, ... })
```

Esses logs ficam visíveis nos Vercel Function Logs, mas não geram alertas.

---

## 3. O que está faltando (Gap G-14)

### 3.1 Rastreamento de erros de runtime

**Problema:** um erro 500 em produção em qualquer API Route ou Server Component não alerta ninguém. O usuário vê uma tela de erro genérica; a equipe não sabe que aconteceu.

**Solução recomendada:** Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configuração mínima:
- Captura automática de erros em Server Components, API Routes e Client Components
- Alertas por e-mail ou Slack para erros P0
- Performance tracking (Core Web Vitals)

### 3.2 Alertas de uptime


**Serviços gratuitos adequados:**
- UptimeRobot (free — 50 monitores, checks a cada 5 min)
- BetterStack Uptime (free tier)

### 3.3 Alertas de ETL atrasado

Não há processo que detecte quando uma coleta ficou muitos dias sem rodar.

**Implementação simples:** query na `coletas_log` verificando se `iniciado_em` de cada fonte está muito antigo. Pode ser uma cronjob no próprio Coolify ou um GitHub Actions de health check.

```sql
-- Fontes com coleta há mais de 48h
SELECT fonte, tipo, MAX(iniciado_em) AS ultima_coleta
FROM coletas_log
WHERE status = 'ok'
GROUP BY fonte, tipo
HAVING MAX(iniciado_em) < NOW() - INTERVAL '48 hours'
```

### 3.4 Monitoramento de performance do banco


---

## 4. Priorização de implementação

| Item | Esforço | Impacto | Prioridade |
|---|---|---|---|
| Sentry no Next.js | 30 min | Alta — erros runtime visíveis | 1ª — próximo sprint |
| UptimeRobot para domínios | 15 min | Alta — downtime detectado em 5 min | 1ª — próximo sprint |
| Alerta ETL atrasado | 2h | Média — dados frescos garantidos | 2ª |
| Performance queries banco | 1 dia | Baixa — só relevante com escala | 3ª |

---

## 5. URLs de referência para operação

| Recurso | URL |
|---|---|
| Vercel Function Logs | Vercel Dashboard → Project → Functions |
| Status de coletas ETL | `meuspoliticos.com.br/admin` → seção ETL |
| Admin logs | `meuspoliticos.com.br/admin/dados` |

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
