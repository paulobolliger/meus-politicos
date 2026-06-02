---
file: docs/INVENTORY_API_CONSUMPTION.md
module: Inventory API Consumption
status: Active
related: [docs/API.md, docs/AUTH.md, docs/INVENTORY_ROUTES.md, docs/INVENTORY_FEATURES.md, docs/GAP_ANALYSIS.md]
---

# Inventory API Consumption

Data do inventario: 2026-06-02.

Este documento responde: **o frontend realmente consome o que o backend oferece?** Ele cruza componentes/rotas UI com endpoints chamados e destaca APIs fantasmas, callbacks externos e lacunas de integracao.

## Resumo

| Categoria | Quantidade | Veredito |
|---|---:|---|
| Endpoints HTTP ativos | 18 | Confirmados em `app/src/app/api` |
| Endpoints consumidos por UI/app | 12 aprox. | Busca, auth, acompanhamento, admin, glossario, analytics, apoio |
| Endpoints sem consumidor UI identificado | 2 | `GET /api/acompanhamentos`, `/api/apoio/verificar-pagamento` |
| Webhooks externos | 1 | InfinitePay |
| Endpoints incompletos | 2 | Webhook InfinitePay, admin ETL run |

## Matriz UI -> API

| Componente/arquivo UI | Endpoint chamado | Metodo | Status consumo | Observacao |
|---|---|---|---|---|
| `app/src/components/busca/BuscaClient.tsx:51` | `/api/busca?...` | GET | Conectado real | Busca publica principal |
| `app/src/components/comparar/CompararClient.tsx:199` | `/api/busca?q=...&limite=8` | GET | Conectado com possivel divergencia | API ignora `limite`; usa `POR_PAGINA=20` |
| `app/src/components/admin/MatchEmendaButton.tsx:25` | `/api/busca?q=...&porPagina=10` | GET | Conectado com possivel divergencia | API nao usa `porPagina`; usa constante |
| `app/src/components/glossario/GlossarioTooltip.tsx:37` | `/api/glossario/${slug}` | GET | Conectado real | Tooltip busca definicao sob demanda |
| `app/src/lib/analytics.ts:17` | `/api/analytics` | POST | Conectado real | Best-effort; nao bloqueia UI |
| `app/src/components/politico/BotaoAcompanhar.tsx:61` | `/api/acompanhamentos` | POST | Conectado real | Follow |
| `app/src/components/politico/BotaoAcompanhar.tsx:98` | `/api/acompanhamentos/${politicoId}` | DELETE | Conectado real | Unfollow |
| `app/src/components/auth/LoginForm.tsx:31` | `/api/auth/logto/sign-in?...` | GET/navigation | Conectado real | Redireciona para Logto |
| `app/src/components/auth/CadastroForm.tsx:45` | `/api/auth/logto/sign-up?...` | GET/navigation | Conectado real | Redireciona para Logto |
| `app/src/components/auth/RecuperarSenhaForm.tsx:15` | `/api/auth/logto/reset-password?email=...` | GET/navigation | Conectado real | Redireciona para Logto |
| `app/src/components/meus-politicos/BotaoSair.tsx:11` | `/api/auth/logto/sign-out` | GET/navigation | Conectado real | Logout |
| `app/src/components/admin/FeatureFlagList.tsx:69` | `/api/admin/flags` | PATCH | Conectado real | Toggle ativo |
| `app/src/components/admin/FeatureFlagList.tsx:94` | `/api/admin/flags` | PATCH | Conectado real | Rollout |
| `app/src/components/admin/PoliticoEditorSection.tsx:45` | `/api/admin/politicos/${politico.id}` | PATCH | Conectado real | Edita politico |
| `app/src/components/admin/MatchEmendaButton.tsx:39` | `/api/admin/emendas/match` | PATCH | Conectado real | Match manual |
| `app/src/components/admin/EtlSourceCard.tsx:60` | `/api/admin/etl/run` | POST | Conectado, mas backend incompleto | Apenas registra solicitacao |
| `app/src/app/(site)/apoio/page.tsx:32` | `/api/apoio/criar-link` | POST | Conectado real | Cria checkout InfinitePay |

## APIs Expostas Sem Consumo UI Identificado

| Endpoint | Metodo | Status | Impacto |
|---|---|---|---|
| `/api/acompanhamentos` | GET | API real, mas painel le direto do banco | Duplicacao de regra; pode ser usada por cards no futuro |
| `/api/apoio/verificar-pagamento` | POST | API fantasma no frontend atual | Confirmacao de pagamento pode nao reconciliar status |

## Webhooks E Callbacks Externos

| Endpoint | Chamador esperado | Status | Lacuna |
|---|---|---|---|
| `/api/webhooks/infinitepay` | InfinitePay | Incompleto | Nao persiste em `doacoes`, sem HMAC/IP allowlist |
| `/api/auth/logto/callback` | Logto | Implementado em codigo | Validacao runtime pendente |

## APIs Admin

| Endpoint | Consumidor | Status backend | Status produto |
|---|---|---|---|
| `/api/admin/flags` | `FeatureFlagList` | Atualiza `feature_flags`, loga `admin_logs` | Operacional |
| `/api/admin/politicos/[id]` | `PoliticoEditorSection` | Atualiza campos permitidos em `politicos` | Operacional parcial |
| `/api/admin/emendas/match` | `MatchEmendaButton` | Atualiza emendas por nome parlamentar | Operacional parcial |
| `/api/admin/etl/run` | `EtlSourceCard` | Insere `admin_logs` | Incompleto; nao executa ETL |

## APIs De Dados Publicos

| Endpoint | Consumidor | Banco | Status |
|---|---|---|---|
| `/api/busca` | Busca, comparar, admin match | `politicos`, `partidos` | Ativo |
| `/api/glossario/[slug]` | Tooltip glossario | `glossario` | Ativo |
| `/api/analytics` | `trackEvent` | `analytics_eventos` | Ativo parcial |

## Inconsistencias De Contrato

| Inconsistencia | Evidencia | Risco | Acao |
|---|---|---|---|
| `CompararClient` usa `limite=8` | `CompararClient.tsx:199` | API nao documenta/usa `limite`; retorna ate 20 | Suportar `limite` ou remover param |
| `MatchEmendaButton` usa `porPagina=10` | `MatchEmendaButton.tsx:25` | API usa constante `POR_PAGINA=20` | Suportar `porPagina` ou ajustar UI |
| Painel nao usa `GET /api/acompanhamentos` | `/painel` le banco direto | Duplicacao de regra de follow | Decidir padrao server-side vs API |
| `/api/apoio/verificar-pagamento` sem UI | Nenhum fetch identificado | Confirmacao pode nao validar pagamento | Conectar em `/apoio/confirmacao` ou remover |
| Webhook InfinitePay retorna 200 sem persistir | `webhooks/infinitepay` | Gateway nao retenta; dado financeiro perdido | Persistir antes do 200 |

## Endpoints Que Nao Devem Ser Tratados Como Fantasma

| Endpoint | Motivo |
|---|---|
| `/api/webhooks/infinitepay` | Chamado por provedor externo, nao UI |
| `/api/auth/logto/callback` | Chamado por Logto |
| `/api/auth/logto/sign-in/sign-up/reset/sign-out` | Consumidos por navegacao/redirect, nao fetch JSON |

## Conclusao

O frontend consome a maioria das APIs relevantes do MVP: busca, glossario, analytics, acompanhamento, admin e criacao de link InfinitePay. As lacunas principais sao contratuais e operacionais: `/api/apoio/verificar-pagamento` nao aparece conectado, `GET /api/acompanhamentos` e redundante com queries server-side, `admin/etl/run` nao aciona ETL real e o webhook InfinitePay nao persiste dados antes de responder `200`.
