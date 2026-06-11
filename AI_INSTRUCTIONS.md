---
file: AI_INSTRUCTIONS.md
module: AI Agent Governance
status: Active
related: [.agent-instructions.md, README.md, docs/TODO_PRODUCTION.md, docs/MODERNIZATION_ROADMAP.md, docs/PRODUCAO_READINESS.md]
---

# AI Instructions

Guia obrigatorio para futuros agentes de IA que atuarem neste repositorio. O objetivo e impedir regressao documental, evitar a reintroducao de informacao legada falsa e manter a base de conhecimento incremental gerada pela macro auditoria funcional e tecnica v4.0 de 2026-06-02.

## Regra Zero

O codigo atual e a fonte primaria. A documentacao consolidada dos lotes v4.0 e a fonte secundaria. Documentos legados, especialmente `docs/meuspoliticos_master.md`, podem conter informacao historica, segredo exposto e stack obsoleta.

Nunca trate mencoes antigas a Supabase Auth ou Stripe como runtime ativo sem confirmar no codigo. O runtime mapeado e:

| Dominio | Estado atual |
|---|---|
| Frontend/backend | Next.js 16.2.6, React 19.2.4, TypeScript |
| Auth | Logto via `@logto/next` |
| RBAC | `perfis.role` via PostgreSQL |
| Banco | PostgreSQL (VPS) acessado diretamente por `pg` |
| Pagamentos | InfinitePay |
| IA | OpenAI server-side/ETL |
| ETL | Scripts Python em `etl/**`, sem orquestracao real no admin |

## Os 6 Pilares Obrigatorios

Todo agente deve operar dentro destes seis pilares. Se uma tarefa violar qualquer pilar, pare e explicite o risco antes de continuar.

## Pilar 1 - Verdade de Codigo e Inventario Incremental

1. Leia o codigo antes de concluir qualquer afirmacao operacional.
2. Use `rg`/`rg --files` para mapear arquivos e usos reais.
3. Ao alterar documentacao, mantenha referencias a arquivos e rotas reais.
4. Nao apague documentos legados sem confirmacao humana.
5. Nao reescreva narrativa historica como se fosse runtime atual.
6. Sempre que descobrir novo fato relevante, atualize o documento canonico correspondente.

Mapa canonico:

| Tema | Documento |
|---|---|
| Visao geral | `README.md` |
| MVP real | `docs/MVP_REAL_IDENTIFICADO.md` |
| Readiness | `docs/PRODUCAO_READINESS.md` |
| Rotas | `docs/INVENTORY_ROUTES.md` |
| Features | `docs/INVENTORY_FEATURES.md` |
| Placeholders | `docs/PLACEHOLDER_REPORT.md` |
| Gaps | `docs/GAP_ANALYSIS.md` |
| Dominio | `docs/BUSINESS_DOMAIN.md` |
| Banco | `docs/DATABASE.md`, `docs/INVENTORY_DATABASE_USAGE.md` |
| Auth | `docs/AUTH.md` |
| API | `docs/API.md`, `docs/INVENTORY_API_CONSUMPTION.md` |
| Arquitetura | `docs/ARCHITECTURE.md` |
| Ambiente | `docs/ENVIRONMENT.md` |
| Integracoes | `docs/INTEGRATIONS.md` |
| Deploy | `docs/DEPLOYMENT.md` |
| Seguranca | `docs/SECURITY.md` |
| Design | `docs/DESIGN.md` |
| Dependencias | `docs/DEPENDENCIES.md` |
| Pendencias | `docs/TODO_PRODUCTION.md` |
| Roadmap | `docs/MODERNIZATION_ROADMAP.md` |

## Pilar 2 - Seguranca, Segredos e Banco

1. Nunca imprima valores reais de segredos.
2. Nunca reproduza o valor de `RESEND_API_KEY` exposto em `docs/meuspoliticos_master.md`.
3. Se encontrar segredo real, registre local, tipo e severidade sem copiar o valor.
4. Antes de qualquer conexao ativa ao banco, classifique o host. Se for remoto/desconhecido, aborte sem confirmacao humana explicita.
5. Toda tentativa de pre-flight DB deve ter timeout maximo de 5 segundos.
6. Nunca execute ETL contra banco remoto/producao sem autorizacao clara do usuario.
7. Nao use `POSTGRES_USER=postgres` como recomendacao de producao; recomende menor privilegio.
8. Trate historico Git contaminado por segredo como risco mesmo apos remover o valor atual.

Bloqueios P0 conhecidos:

| Bloqueio | Documento |
|---|---|
| Chave Resend aparente em doc legado | `docs/SECURITY.md`, `docs/TODO_PRODUCTION.md` |
| Webhook InfinitePay sem persistencia | `docs/API.md`, `docs/GAP_ANALYSIS.md` |
| Banco remoto/desconhecido sem pre-flight ativo | `docs/PRODUCAO_READINESS.md` |

## Pilar 3 - Produto, Core Loop e Honestidade de Estado

O MVP real e o core loop:

```text
buscar politico -> abrir perfil -> acompanhar -> painel/feed civico
```

Regras:

1. Nao priorize features perifericas antes de estabilizar esse loop.
2. Nao apresente feed civico como produtivo enquanto `FeedCivico` nao estiver conectado a eventos reais.
3. Nao apresente candidatos 2026 como completo sem validar ETL/dados.
4. Nao permita que a UI de apoio sugira confirmacao financeira se o webhook nao persistir pagamento.
5. Use estados vazios honestos em vez de mock silencioso.
6. Todo texto de IA deve sinalizar origem quando aplicavel.

Fraturas do produto:

| Fratura | Fonte |
|---|---|
| Feed civico incompleto | `docs/ARCHITECTURE.md`, `docs/DESIGN.md` |
| Candidatos 2026 incompleto | `docs/PLACEHOLDER_REPORT.md`, `docs/DESIGN.md` |
| API de verificacao InfinitePay sem UI consumidora | `docs/INVENTORY_API_CONSUMPTION.md` |
| Admin ETL nao dispara job | `docs/API.md`, `docs/DEPLOYMENT.md` |

## Pilar 4 - Arquitetura, Integracoes e Operacao

1. A aplicacao web roda em Next.js App Router.
2. O deploy alvo documentado e Vercel via `vercel.json`.
3. O banco e acessado por `pg`, nao por Prisma/Drizzle no runtime mapeado.
4. Logto e o provedor de identidade ativo; `auth.users` e fallback legado de reconciliacao.
5. InfinitePay e o pagamento ativo; Stripe e historico/legado.
6. OpenAI deve permanecer server-side/ETL.
7. ETL Python nao faz parte do build Vercel e precisa runner externo.
8. Antes de mudar dependencias, avaliar React 19/Next.js 16 e rodar build.

Arquivos-chave:

| Area | Arquivos |
|---|---|
| Proxy/auth host | `app/src/proxy.ts` |
| Logto | `app/src/lib/logto/*`, `app/src/app/api/auth/logto/*` |
| Current user/RBAC | `app/src/lib/auth/current-user.ts`, `profile-linking.ts` |
| InfinitePay | `app/src/app/api/apoio/*`, `app/src/app/api/webhooks/infinitepay/route.ts` |
| OpenAI | `app/src/actions/resumo-interpretativo.ts`, `etl/ia/simplificar_proposicoes.py` |
| ETL | `etl/**` |
| Build | `package.json`, `app/package.json`, `vercel.json` |

## Pilar 5 - Design, Acessibilidade e UX Operacional

1. Use os tokens de `app/src/app/globals.css`.
2. Prefira `app/src/components/ui` para botoes, badges, tabs, dialogs, sheets, inputs, avatars, separators e skeletons.
3. Use `lucide-react` para icones funcionais.
4. Evite emojis como icones de navegacao/admin.
5. Reduza inline styles em novas implementacoes.
6. Diferencie visualmente: dado real, dado ausente, mock, "em breve" e erro.
7. Em telas admin/SaaS-like, priorize densidade, scan e clareza operacional.
8. Em alteracoes frontend significativas, valide desktop/mobile quando houver servidor disponivel.

Rotas criticas de QA:

| Rota | Motivo |
|---|---|
| `/busca` e `/app-busca` | Entrada do core loop |
| `/politicos/[id]` | Perfil e acompanhamento |
| `/painel` | Fechamento do loop |
| `/apoio` e `/apoio/confirmacao` | Risco financeiro/UX |
| `/admin/etl` | Risco de falsa automacao |
| `/candidatos-2026` | Risco de completude falsa |

## Pilar 6 - Fluxo de Trabalho, Documentacao e Fechamento

1. Trabalhe em lotes pequenos quando a mudanca for documental ampla.
2. Antes de editar arquivo existente, entenda se ele e legado ou canonico.
3. Preserve alteracoes do usuario; nunca reverta sem pedido explicito.
4. Ao final de qualquer mudanca tecnica, atualize docs impactados.
5. Ao final de qualquer mudanca documental macro, atualize `CHANGELOG.md`.
6. Use `docs/TODO_PRODUCTION.md` como fila consolidada de P0-P3.
7. Use `docs/MODERNIZATION_ROADMAP.md` para priorizacao estrategica.
8. Se fizer commit, mantenha escopo claro e nao inclua segredos.

Checklist antes de responder "pronto":

| Checagem | Obrigatoria? |
|---|---|
| Arquivos alterados pertencem ao escopo pedido | Sim |
| YAML/front matter preservado em docs canonicos | Sim |
| Nenhum valor real de segredo foi impresso | Sim |
| `git status --short` conferido quando houve escrita | Sim |
| Build/test informados como executados ou nao executados | Sim |
| Proximo passo humano indicado quando houver bloqueio | Sim |

## Estado Final da Auditoria v4.0

Veredito tecnico: o projeto tem um MVP real identificavel e uma base arquitetural aproveitavel, mas nao esta pronto para producao plena enquanto P0/P1 de seguranca, pagamentos, banco, ETL e feed civico permanecerem abertos.
