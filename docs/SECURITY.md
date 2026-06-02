---
file: docs/SECURITY.md
module: Security Audit
status: Active
related: [docs/AUTH.md, docs/ENVIRONMENT.md, docs/API.md, docs/INTEGRATIONS.md, docs/GAP_ANALYSIS.md, docs/PRODUCAO_READINESS.md]
---

# Seguranca

Este documento registra a auditoria de seguranca atual do projeto em 2026-06-02, com foco em Logto/RBAC, webhooks, segredos, exposicao client e plano urgente de rotacao da chave P0 da Resend detectada em documento legado.

## 1. Superficie de Ataque

| Superficie | Arquivos/rotas | Estado | Risco |
|---|---|---|---|
| Auth Logto | `app/src/app/api/auth/logto/*`, `app/src/lib/logto/*` | Ativo | Redirect/env incorretos podem quebrar sessao |
| Proxy multi-host | `app/src/proxy.ts` | Ativo | Barreiras dependem de host correto |
| APIs publicas | `/api/busca`, `/api/glossario`, `/api/analytics`, `/api/apoio/*` | Ativas | Rate limit e validacao limitados |
| APIs autenticadas | `/api/acompanhamentos*` | Ativas | Dependem de `getCurrentUser()` e perfil reconciliado |
| APIs admin | `/api/admin/*` | Ativas | Dependem de `role === 'admin'` |
| Webhook InfinitePay | `/api/webhooks/infinitepay` | Incompleto | Sem assinatura e sem persistencia |
| Banco | `POSTGRES_*` via `pg` | Ativo | Usuario/privilegios e repeticao de Pool |
| IA/OpenAI | Server Action e ETL | Ativo condicionado | Custo e prompt/data governance |
| Docs versionados | `docs/meuspoliticos_master.md` | Problema P0 | Chave Resend aparente exposta |

## 2. Logto e RBAC

### 2.1 Modelo Atual

| Camada | Implementacao | Garantia |
|---|---|---|
| Sessao | `getLogtoContext(getLogtoConfig(), { fetchUserInfo: true })` | Usuario autenticado no Logto |
| Usuario preliminar | `buildCurrentUserFromLogto()` | Extrai `sub`, email/nome e claims |
| Perfil operacional | `getProfileByLogtoSubPostgres()` | Resolve `perfis.logto_sub` |
| Reconciliacao legado | `linkLogtoProfileByLegacyEmailPostgres()` | Tenta vincular por email legado em `auth.users` |
| Role | `perfis.role` | `user` ou `admin` conforme tipo mapeado |
| Guard admin | `getCurrentUser()` + `user.role !== 'admin'` | Bloqueia endpoints admin |

### 2.2 Barreiras de Rota

| Contexto | Arquivo | Regra |
|---|---|---|
| Host painel | `app/src/proxy.ts` | Sem sessao: redirect para `/login` ou 401 em API |
| Rotas auth | `app/src/proxy.ts` | `/login`, `/cadastro`, `/recuperar-senha`, `/auth`, `/api/auth/logto` liberadas |
| Host app | `app/src/proxy.ts` | `/` -> `/home`, `/busca` -> `/app-busca`, `/login` -> painel |
| Main host | `app/src/proxy.ts` | `/login` redireciona para painel em producao |
| Admin API | `app/src/app/api/admin/**` | Exige usuario admin |

### 2.3 Pontos Fortes

| Controle | Evidencia |
|---|---|
| Segredos Logto obrigatorios | `getRequiredEnv()` em `app/src/lib/logto/config.ts` |
| Cookie seguro em producao | `cookieSecure: process.env.NODE_ENV === 'production'` |
| RBAC server-side | Endpoints admin checam `getCurrentUser()` |
| Perfil reconciliado no banco | `perfis.logto_sub`, `auth_provider`, `migrado_logto_em` |

### 2.4 Gaps

| Prioridade | Gap | Impacto | Acao |
|---|---|---|---|
| P1 | Guard admin duplicado por endpoint | Risco de endpoint novo esquecer check | Criar helper `requireAdmin()` compartilhado |
| P1 | Perfil sem `logto_sub` retorna null | Usuario autenticado pode ficar sem acesso operacional | Finalizar migracao/reconciliacao |
| P1 | Sem rate limit em auth-adjacent/API publicas | Abuso de busca/analytics/apoio | Adicionar rate limit por IP/usuario |
| P2 | Claims Logto nao usadas para RBAC direto | RBAC depende do banco | Aceitavel, mas documentar fonte oficial de role |

## 3. Relatorio de Varredura de Segredos

### 3.1 Escopo Executado

Comandos executados sem imprimir o valor sensivel:

| Comando | Objetivo |
|---|---|
| `rg -n --no-heading "RESEND_API_KEY=|OPENAI_API_KEY=|STRIPE_SECRET_KEY=|LOGTO_APP_SECRET=|LOGTO_COOKIE_SECRET=|POSTGRES_PASSWORD=|NEXT_PUBLIC_.*(SECRET|KEY|PASSWORD)|PRIVATE_KEY=" . --glob '!node_modules/**' --glob '!app/.next/**'` | Varredura textual do workspace atual |
| `git log --all --oneline -- docs/meuspoliticos_master.md` | Historico do arquivo legado afetado |
| `git log --all --oneline -S RESEND_API_KEY -- docs/meuspoliticos_master.md` | Historico Git por introducao/remocao nominal de `RESEND_API_KEY` |

### 3.2 Achado P0 Confirmado

| Achado | Local | Severidade | Status |
|---|---|---|---|
| Valor aparente real de `RESEND_API_KEY` | `docs/meuspoliticos_master.md:229` e `docs/meuspoliticos_master.md:264` | P0 | Presente no workspace atual |

O valor nao foi reproduzido neste documento para evitar ampliar a exposicao.

### 3.3 Historico Git Afetado

Ocorrencias nominais de `RESEND_API_KEY` foram encontradas no historico de `docs/meuspoliticos_master.md` nos commits:

| Commit | Mensagem |
|---|---|
| `50ad33a` | Session checkpoint |
| `824978d` | Session checkpoint |
| `27ef38f` | Session checkpoint |
| `6324566` | `feat: setup supabase clients, middleware e componentes shadcn/ui` |

O arquivo tambem aparece em commits posteriores sem necessariamente alterar a string. Como o segredo entrou no historico, remover apenas o conteudo atual nao elimina exposicao se o repositorio ja foi compartilhado.

### 3.4 Outros Resultados da Varredura Atual

| Categoria | Resultado |
|---|---|
| Placeholders seguros | `.env.example`, `README.md`, `docs/ENVIRONMENT.md` contem nomes/placeholder de env |
| `OPENAI_API_KEY` | Apenas placeholder/documentacao sem valor real aparente no scan atual |
| `POSTGRES_PASSWORD` | Placeholder/template/documentacao; nenhum valor real impresso pelo scan |
| `LOGTO_APP_SECRET`/`LOGTO_COOKIE_SECRET` | Placeholder/template/documentacao |
| `NEXT_PUBLIC_*SECRET/KEY/PASSWORD` | Nenhuma exposicao client de segredo identificada |
| Stripe | Referencias legadas em docs; runtime atual usa InfinitePay |

## 4. Plano de Rotacao Urgente Resend P0

### 4.1 Objetivo

Invalidar imediatamente a chave Resend exposta, remover o segredo do workspace atual e reduzir risco residual no historico.

### 4.2 Sequencia Obrigatoria

| Ordem | Acao | Responsavel | Resultado esperado |
|---:|---|---|---|
| 1 | Revogar a chave atual no painel da Resend | Humano com acesso ao provedor | Chave exposta deixa de funcionar |
| 2 | Criar nova chave com menor escopo possivel | Humano | Nova credencial ativa |
| 3 | Atualizar secret manager do ambiente que realmente usa email | Humano/DevOps | Runtime nao depende da chave antiga |
| 4 | Substituir ocorrencias em `docs/meuspoliticos_master.md` por placeholder | Engenharia | Workspace atual sem segredo |
| 5 | Rodar nova varredura textual | Engenharia | Sem valor real no workspace |
| 6 | Se repo publico/compartilhado, reescrever historico ou abrir incidente formal | Tech PM/Owner | Risco residual documentado |
| 7 | Registrar data/hora de revogacao | Tech PM | Evidencia de resposta a incidente |

### 4.3 Comandos de Verificacao Pos-remocao

```bash
rg -n --no-heading "RESEND_API_KEY=" . --glob '!node_modules/**' --glob '!app/.next/**'
git log --all --oneline -S RESEND_API_KEY -- docs/meuspoliticos_master.md
```

Nota: o segundo comando pode continuar mostrando historico ate que haja reescrita de historico. Isso nao significa que a chave ainda esteja ativa; significa que a string existiu em commits.

## 5. Webhooks e Pagamentos

| Endpoint | Estado | Risco | Acao |
|---|---|---|---|
| `/api/webhooks/infinitepay` | Recebe payload, valida campos minimos, loga e retorna `{ ok: true }` | Evento falso, perda de confirmacao, sem idempotencia | Implementar assinatura/origem, persistencia e idempotencia |
| `/api/apoio/criar-link` | Cria link InfinitePay | Abuso de criacao de links, sem rate limit | Rate limit e logs estruturados |
| `/api/apoio/verificar-pagamento` | Consulta provider | Sem consumidor UI mapeado | Definir uso ou remover |

Requisitos minimos para webhook seguro:

1. Validacao de assinatura/HMAC ou mecanismo equivalente suportado pela InfinitePay.
2. Persistencia de payload bruto sanitizado.
3. Idempotencia por `transaction_nsu`/`order_nsu`.
4. Estado transacional `created -> paid -> failed/refunded` quando aplicavel.
5. Logs sem dados sensiveis.

## 6. Banco e Acesso a Dados

| Area | Estado | Risco | Recomendacao |
|---|---|---|---|
| Conexao | `pg` direto com `new Pool()` em varios arquivos | Politica inconsistente de timeout/SSL | Centralizar factory |
| Usuario | Defaults frequentes para `postgres` | Privilegio excessivo | Criar usuario app read/write limitado e usuario ETL separado |
| RLS | Nao e a barreira principal do runtime mapeado | Conexao direta pode contornar politicas Supabase | Aplicar least privilege no PostgreSQL |
| Erros SQL | Alguns endpoints retornam `message`/`code` | Pode expor detalhe interno | Normalizar erro publico e log interno |

## 7. Validacao de Input

| Area | Estado | Risco |
|---|---|---|
| Busca | Params tratados e SQL parametrizado | Contratos divergentes `limite`/`porPagina`; sem rate limit |
| Acompanhamentos | JSON validado parcialmente; SQL parametrizado | Falhas retornam mensagem DB |
| Admin flags/politicos/emendas | Campos limitados por allowlist parcial | Sem schema Zod compartilhado |
| IA | `zod` usado em server action | Custos/prompt governance |
| Analytics | Payload aceito de forma ampla | Pode crescer lixo operacional |

## 8. Exposicao Client de Segredos

| Variavel | Status |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Publica e aceitavel |
| `NEXT_PUBLIC_APP_URL` | Publica e aceitavel |
| `NEXT_PUBLIC_PAINEL_URL` | Publica e aceitavel |
| `NEXT_PUBLIC_OPENAI_API_KEY` | Nao identificada |
| `NEXT_PUBLIC_RESEND_API_KEY` | Nao identificada |
| `NEXT_PUBLIC_POSTGRES_*` | Nao identificada |
| `NEXT_PUBLIC_LOGTO_APP_SECRET` | Nao identificada |

## 9. Headers e Hardening

Nao foi identificada politica customizada consolidada de headers em `next.config.ts` durante os lotes anteriores. Recomendado:

| Header/controle | Recomendacao |
|---|---|
| CSP | Definir politica compativel com Logto, InfinitePay e assets externos |
| `X-Frame-Options`/frame ancestors | Impedir clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Restringir geolocalizacao/camera/microfone conforme uso |
| HSTS | Habilitar em dominios HTTPS de producao |

## 10. Prioridades

| Prioridade | Item | Prazo recomendado |
|---|---|---|
| P0 | Revogar chave Resend vazada | Imediato |
| P0 | Remover valor real de `docs/meuspoliticos_master.md` | Imediato apos revogacao |
| P0/P1 | Implementar seguranca/persistencia do webhook InfinitePay | Antes de producao financeira |
| P1 | Centralizar DB e aplicar least privilege | Antes de producao plena |
| P1 | Criar `requireAdmin()`/`requireUser()` compartilhados | Proxima iteracao backend |
| P1 | Rate limit para busca, analytics, apoio e auth-adjacent | Proxima iteracao infra |
| P2 | Headers customizados e CSP | Antes de go-live publico |
