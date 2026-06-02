---
file: docs/TODO_PRODUCTION.md
module: Production Readiness Checklist
status: Active
related: [docs/GAP_ANALYSIS.md, docs/SECURITY.md, docs/ENVIRONMENT.md, docs/DEPLOYMENT.md]
---

# Checklist de Prontidão para Produção

Este documento lista tudo que **precisa estar resolvido antes do go-live**. Organizado por bloco funcional — não por prioridade teórica, mas por ordem de execução lógica (o que depende do quê).

> Para contexto completo de cada gap, ver `docs/GAP_ANALYSIS.md`.
>
> Atualização junho/2026: Stripe foi removido do runtime e das dependências. As seções ligadas a Stripe permanecem apenas como histórico de auditoria; o fluxo ativo de apoio usa InfinitePay.

---

## Bloco 0 — Pré-requisito absoluto

Estes itens desbloqueiam todos os outros. Não há como desenvolver em equipe ou em CI sem eles.

### 0.1 · Atualizar `.env.example`

**Gap:** G-01 · **Esforço:** 30 min

- [ ] Copiar todas as 30+ variáveis de `app/.env.local` para `.env.example` (apenas placeholders — nunca valores reais)
- [ ] Referência completa disponível em `docs/ENVIRONMENT.md §1–9`

**Critério de conclusão:** novo desenvolvedor consegue rodar `npm run dev` a partir do `.env.example` + instruções do README sem acessar o `.env.local` de produção.

---

## Bloco 1 — Dados financeiros (P0)

Bloqueio legal e de confiança. Pagamentos processados sem registro = sem histórico de apoiadores.

### 1.1 · Criar tabela `doacoes`

**Pré-requisito para G-02 e G-03**


```sql
CREATE TABLE doacoes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway          text NOT NULL CHECK (gateway IN ('stripe', 'infinitepay')),
  tipo             text NOT NULL CHECK (tipo IN ('mensal', 'unica')),
  valor_centavos   integer NOT NULL,
  status           text NOT NULL DEFAULT 'confirmado',
  nome_apoiador    text,
  email_apoiador   text,
  gateway_id       text UNIQUE,          -- payment_intent.id (Stripe histórico) / order_nsu (InfinitePay)
  payload_raw      jsonb,               -- payload completo do webhook para auditoria
  criado_em        timestamptz DEFAULT now()
);

-- RLS: apenas admin pode ler
ALTER TABLE doacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_doacoes" ON doacoes
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin'));
```

- [ ] Aplicar a migration via SSH no VPS (ver `docs/DEPLOYMENT.md §4`)

### 1.2 · Persistir doação no webhook Stripe (histórico)

**Gap:** G-02 · **Arquivo:** `app/src/app/api/webhooks/stripe/route.ts:40` · **Esforço:** 2h

- [ ] Substituir o `// TODO: registrar em doacoes no banco` por INSERT real
- [ ] Extrair do `event.data.object` (PaymentIntent): `id`, `amount`, `metadata.tipo`, `metadata.nome`, `metadata.email`
- [ ] Usar `createAdminClient()` (service role) — webhook não tem sessão de usuário
- [ ] Tratar idempotência: `ON CONFLICT (gateway_id) DO NOTHING` — Stripe pode entregar o evento mais de uma vez
- [ ] Adicionar tratamento do evento `payment_intent.payment_failed` → registrar com `status = 'falhou'`

**Critério de conclusão:** após um pagamento teste no Stripe Dashboard, um registro aparece em `SELECT * FROM doacoes WHERE gateway = 'stripe'`.

### 1.3 · Persistir doação no webhook InfinitePay

**Gap:** G-03 · **Arquivo:** `app/src/app/api/webhooks/infinitepay/route.ts:34` · **Esforço:** 1h

- [ ] Substituir o `// TODO: registrar doação no banco de dados` por INSERT real
- [ ] Extrair do payload: `order_nsu` (→ `gateway_id`), `transaction_nsu`, valor pago, status
- [ ] Parsear `order_nsu` para extrair o tipo: `startsWith('apoio-mensal')` → `'mensal'`
- [ ] Usar `createAdminClient()` para o INSERT
- [ ] Idempotência: `ON CONFLICT (gateway_id) DO NOTHING`

**Critério de conclusão:** registro aparece em `SELECT * FROM doacoes WHERE gateway = 'infinitepay'` após pagamento de teste.

### 1.4 · Adicionar HMAC ao webhook InfinitePay

**Gap de segurança P2 · Arquivo:** `app/src/app/api/webhooks/infinitepay/route.ts`

- [ ] Verificar se a InfinitePay suporta assinatura de webhook (consultar documentação da API)
- [ ] Se sim: implementar verificação de HMAC ou Bearer token antes de processar o payload
- [ ] Se não: documentar a limitação e implementar validação de IP de origem como alternativa

---

## Bloco 2 — ETL e dados (P1)

Sem dados atualizados, a plataforma exibe informações desatualizadas ou vazias.

### 2.1 · Gastos Câmara 2026

**Gap:** G-07 · **Script:** `etl/camara/collect_camara_gastos.py` · **Esforço:** 1 dia

- [ ] Conectar ao VPS via SSH com o túnel correto (ver `docs/DEPLOYMENT.md §3`)
- [ ] Executar: `python etl/camara/collect_camara_gastos.py --ano 2026`
- [ ] Verificar INSERT em `coletas_log` com `status = 'ok'`
- [ ] Confirmar no banco: `SELECT COUNT(*) FROM gastos WHERE source_id = 'camara_ceap' AND EXTRACT(YEAR FROM data) = 2026`

**Critério de conclusão:** gastos de 2026 aparecem nos perfis de deputados federais.

### 2.2 · Re-rodar coleta de senadores (mandato_inicio)

**Gap:** G-08 · **Script:** `etl/senado/collect_senadores.py` · **Esforço:** 2h

- [ ] Bug corrigido no script (ver `app/CLAUDE.md`) — precisa re-rodar para popular `mandato_inicio`
- [ ] Executar: `python etl/senado/collect_senadores.py`
- [ ] Validar: `SELECT id, nome, mandato_inicio FROM politicos WHERE cargo = 'senador' AND mandato_inicio IS NULL`
- [ ] Resultado esperado: zero senadores com `mandato_inicio IS NULL`

### 2.3 · Populate SIAFI dos senadores

**Gap:** G-09 · **Script:** `etl/portal_transparencia/populate_siafi.py` · **Esforço:** 1h

**Pré-requisito:** G-08 concluído (senadores com dados corretos antes de cruzar com SIAFI)

- [ ] Executar após G-08: `python etl/portal_transparencia/populate_siafi.py`
- [ ] Validar: `SELECT COUNT(*) FROM politicos WHERE cargo = 'senador' AND codigo_siafi IS NULL`
- [ ] Resultado esperado: zero (ou mínimo — políticos sem emenda no período)

### 2.4 · Verificar status do ETL de ALEs

**Gap:** G-13 · **Diretório:** `etl/ale/`

- [ ] Verificar quais scripts já foram executados: `SELECT fonte, MAX(iniciado_em) FROM coletas_log WHERE fonte LIKE 'ale%' GROUP BY fonte`
- [ ] Verificar deputados estaduais no banco: `SELECT uf, COUNT(*) FROM politicos WHERE cargo = 'deputado_estadual' GROUP BY uf ORDER BY uf`
- [ ] Commitar `etl/ale/` na branch atual (diretório não rastreado — Gap G-13)
- [ ] Atualizar `app/CLAUDE.md` com status por UF

### 2.5 · Commitar logos de partidos

**Gap:** G-15 · **Diretório:** `app/public/partidos/`

- [ ] `git add app/public/partidos/`
- [ ] Verificar tamanho total antes de commitar (logos PNG podem ser grandes)

---

## Bloco 3 — Qualidade do código (P1)

### 3.1 · Corrigir links inativos em candidatos-2026

**Gap:** G-05 · **Arquivo:** `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx` · **Esforço:** 2h

- [ ] Linha 168: identificar qual ação o `href="#"` deveria executar e implementar
- [ ] Linha 329: idem
- [ ] Se a feature não existe ainda: substituir `<a href="#">` por `<button disabled>` com tooltip "Em breve" ou remover o link completamente

**Critério de conclusão:** `grep -r 'href="#"' app/src/` retorna zero resultados.

---

## Bloco 4 — Automação (P0)

### 4.1 · Criar workflows GitHub Actions para ETL

**Gap:** G-04 · **Diretório:** `.github/workflows/` (a criar) · **Esforço:** 1 dia

O ETL hoje é 100% manual. Qualquer ausência da equipe = dados parados.

- [ ] Criar `.github/workflows/collect-camara.yml`:

```yaml
name: ETL Câmara
on:
  schedule:
    - cron: '0 9 * * *'  # 06h BRT = 09h UTC
  workflow_dispatch:

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt
      - run: python etl/camara/collect_deputados.py
        env:
          POSTGRES_HOST: ${{ secrets.POSTGRES_HOST }}
          POSTGRES_PORT: ${{ secrets.POSTGRES_PORT }}
          POSTGRES_DB: ${{ secrets.POSTGRES_DB }}
          POSTGRES_USER: ${{ secrets.POSTGRES_USER }}
          POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
      - run: python etl/camara/collect_votacoes.py
      - run: python etl/camara/collect_camara_gastos.py
      - run: python etl/camara/collect_proposicoes.py
```

- [ ] Criar `.github/workflows/collect-senado.yml` (mesmo padrão)
- [ ] Criar `.github/workflows/collect-emendas.yml` (mesmo padrão)
- [ ] Criar `.github/workflows/ci.yml` — lint + typecheck (sem testes até G-06 ter progresso)
- [ ] Adicionar todos os `POSTGRES_*` como GitHub Secrets no repositório
- [ ] ⚠️ **Atenção:** os scripts precisam de acesso ao banco de produção — usar túnel SSH ou IP whitelist. O GitHub Actions usa IPs dinâmicos — configurar acesso por senha ou chave SSH, não por IP

**Critério de conclusão:** workflow executa manualmente (`workflow_dispatch`) com sucesso. Verificar `coletas_log` após execução.

---

## Bloco 5 — Observabilidade (P2)

### 5.1 · Instalar Sentry

**Gap:** G-14 · **Esforço:** 30 min

- [ ] `cd app && npm install @sentry/nextjs`
- [ ] `npx @sentry/wizard@latest -i nextjs` — configura automaticamente `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- [ ] Criar projeto no Sentry.io (free tier — 5k eventos/mês)
- [ ] Adicionar `SENTRY_DSN` ao `.env.local` e ao Vercel Environment Variables
- [ ] Configurar alerta de e-mail para erros P0 (500 em produção)

**Critério de conclusão:** lançar um erro de teste (`throw new Error('test sentry')` em uma API route) → verificar se aparece no dashboard do Sentry.

### 5.2 · Configurar UptimeRobot

**Gap:** G-14 · **Esforço:** 15 min

- [ ] Criar conta gratuita em UptimeRobot (50 monitores, check a cada 5 min)
- [ ] Adicionar monitores para:
  - `https://meuspoliticos.com.br` (site público)
  - `https://app.meuspoliticos.com.br` (app analítico)
- [ ] Configurar alerta de e-mail/SMS para downtime

---

## Bloco 6 — Infraestrutura e Segurança (P2)

### 6.1 · HTTP Security Headers

**Gap identificado em `docs/SECURITY.md §gaps`**

O Next.js não adiciona headers de segurança por padrão. Adicionar em `app/next.config.ts`:

- [ ] `Strict-Transport-Security` (HSTS)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`

### 6.2 · Rotação de credenciais

- [ ] Revisar se alguma credencial de produção foi exposta acidentalmente (rodar `git log --all -S "sk_live_"` e equivalentes)
- [ ] Agendar rotação periódica trimestral das chaves de API (ver `docs/SECURITY.md §rotação`)

### 6.3 · Modo produção Stripe (histórico)

Stripe foi removido do runtime. O fluxo ativo de apoio não usa mais chaves Stripe:

- [ ] Manter a documentação histórica apenas para auditoria
- [ ] Evitar reintroduzir `STRIPE_*` no template de ambiente
- [ ] Concentrar novos testes de apoio no fluxo InfinitePay

---

## Bloco 7 — Testes mínimos (P1)

Sem testes, qualquer deploy pode quebrar features silenciosamente.

### 7.1 · Setup de Vitest

**Gap:** G-06 (parcial) · **Esforço:** 2h

- [ ] Instalar Vitest + React Testing Library (ver `docs/TESTING.md §3`)
- [ ] Configurar `app/vitest.config.ts` e `app/src/test/setup.ts`
- [ ] Adicionar scripts `test` e `typecheck` ao `app/package.json`

### 7.2 · Testes mínimos de go-live

Com setup feito, escrever apenas os testes de maior risco antes do lançamento:

- [ ] Teste do webhook Stripe: assinatura válida → 200 + INSERT em `doacoes` (mock)
- [ ] Teste do schema Zod de `/api/apoio/criar-intent`: valor < 5 → erro
- [ ] Teste da função de cálculo de `presenca_pct_atual` (quando G-10 for resolvido)

---

## Bloco 8 — Conteúdo e dados de exibição (P1)

### 8.1 · Scores de METRICS.md

**Gap:** G-10 · **Esforço:** 1–2 sprints

Todos os scores (Presença, Atividade Legislativa, Alinhamento de Bancada) exibem `"–"` para todos os políticos.

- [ ] Criar e executar `etl/camara/collect_presenca.py` — coleta de presença em sessões via `GET /deputados/{id}/eventos`
- [ ] Verificar se `votacoes` e `presenca` têm dados suficientes para calcular LES e alinhamento
- [ ] Implementar a lógica de cálculo conforme `docs/METRICS.md`
- [ ] Habilitar exibição de scores no componente `ScoreRow.tsx`

---

## Bloco 9 — Documentação final (P3)

- [ ] `AI_INSTRUCTIONS.md` — instruções para agentes IA (Lote 8)
- [ ] `CHANGELOG.md` — histórico estruturado de versões (Gap G-17, Lote 8)
- [ ] File banners nos arquivos core (Gap G-19) — incrementalmente durante desenvolvimento

---

## Resumo executivo — Go/No-Go

| Bloco | Item | Bloqueante para go-live? |
|---|---|---|
| 0.1 | `.env.example` completo | ✅ Sim — equipe e CI |
| 1.1–1.3 | Persistência de doações | ✅ Sim — financeiro |
| 2.1–2.3 | Gastos 2026, senadores, SIAFI | ✅ Sim — dados errados/ausentes |
| 3.1 | `href="#"` candidatos-2026 | ✅ Sim — UX quebrada |
| 4.1 | GitHub Actions ETL | ✅ Sim — dados param sem equipe |
| 1.4 | HMAC InfinitePay | ⚠️ Recomendado — segurança |
| 5.1–5.2 | Sentry + UptimeRobot | ⚠️ Recomendado — operação |
| 6.1 | Security headers | ⚠️ Recomendado |
| 6.3 | Stripe modo produção | ⚪ Arquivado — Stripe removido do runtime |
| 7.1–7.2 | Testes mínimos | ⚠️ Recomendado |
| 8.1 | Scores METRICS.md | ⚠️ Recomendado (pode lançar com "–") |
| 2.4–2.5 | ALEs + logos git | ⚠️ Recomendado |
| G-11 | Turbo monorepo | ❌ Não bloqueante |
| G-06 | Cobertura total de testes | ❌ Não bloqueante |

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
