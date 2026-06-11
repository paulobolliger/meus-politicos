# Inventário Operacional — meus-politicos

Data da análise: 2026-06-07
Escopo analisado: monorepo completo (app, db, docs, etl, configs de deploy e envs locais)
Regra de sigilo aplicada: valores de segredo não são reproduzidos neste relatório

## 1. Stack principal

| Item | Identificado | Evidência |
|---|---|---|
| Framework web | Next.js 16 (App Router) | package.json (raiz e app), app/src/app |
| Linguagem web | TypeScript + React 19 | app/package.json, app/src/**/*.ts, app/src/**/*.tsx |
| Package manager JS | npm (lockfile presente) | package-lock.json, app/package-lock.json |
| Backend de dados | PostgreSQL via pg (sem ORM) | app/src/lib/db/pool.ts, múltiplos Pool em app/src |
| Auth | Logto (@logto/next) + perfil interno em perfis | app/package.json, app/src/lib/logto/*, app/src/lib/auth/* |
| ETL | Python + psycopg | requirements.txt, etl/**/*.py |
| IA | OpenAI SDK (Node e Python) | app/src/actions/resumo-interpretativo.ts, etl/ia/simplificar_proposicoes.py |
| Pagamentos | InfinitePay | app/src/app/api/apoio/*, app/src/app/api/webhooks/infinitepay/route.ts |
| UI | Tailwind CSS v4 + shadcn + Recharts + Framer Motion | app/package.json |

### Versões de runtime

| Runtime | Estado |
|---|---|
| Node | Não há pin de versão via .nvmrc/.node-version/.tool-versions |
| Python | Não há pin de versão via .python-version/pyproject |
| PostgreSQL local de referência | Supabase config aponta major_version=17 em db/config.toml |

### Scripts principais

| Escopo | Script | Comando |
|---|---|---|
| Raiz | dev | npm --prefix app run dev |
| Raiz | build | npm --prefix app run build |
| Raiz | start | npm --prefix app run start |
| Raiz | lint | npm --prefix app run lint |
| app | dev/build/start/lint | next dev / next build / next start / eslint |

Observação: não foram encontrados scripts de teste automatizado no package.json (raiz/app).

## 2. Estrutura do projeto

### Pastas principais

| Pasta | Função operacional |
|---|---|
| app | Aplicação Next.js (site, app analítico, painel, admin e APIs internas) |
| db | Schema e migrations SQL |
| docs | Documentação técnica, operacional e de status |
| etl | Coletas e cargas Python (Câmara, Senado, TSE, IBGE, Portal, ALE, IA, estados) |
| data | Dados geográficos e insumos |
| scratch | Scripts de inspeção e utilitários locais |

### Rotas/páginas/APIs (resumo)

| Área | Exemplos identificados |
|---|---|
| Site público | /, /busca, /politicos/[id], /projetos, /partidos, /estado/[sigla], /camara, /senado, /candidatos-2026, /apoio |
| App analítico | /home, /comparar, /politicos/[id] (em route group app) |
| Painel autenticado | /painel, /meus-politicos, /login, /cadastro, /recuperar-senha |
| Admin | /admin, /admin/usuarios, /admin/flags, /admin/dados, /admin/etl, /admin/analytics |
| API | /api/busca, /api/glossario/[slug], /api/acompanhamentos, /api/auth/logto/*, /api/apoio/*, /api/webhooks/infinitepay, /api/admin/* |

### Workers/jobs

| Item | Estado |
|---|---|
| Job runner interno no app | Não encontrado |
| Endpoint de disparo ETL | Existe (api/admin/etl/run), hoje registra solicitação em admin_logs |
| Jobs reais | Scripts Python em etl executados fora do runtime web |

### Scripts úteis

- ETL por fonte em etl/camara, etl/senado, etl/tse, etl/ibge, etl/portal_transparencia, etl/ale, etl/estados, etl/stn.
- Script de mídia: etl/tse/upload_photos_cloudinary.py.
- Diversos scripts de inspeção em scratch/.

## 3. Configuração

### Arquivos env encontrados

| Arquivo | Status |
|---|---|
| .env.example | Template versionado |
| app/.env.local | Arquivo local com variáveis preenchidas |

### Variáveis necessárias (por código ativo)

| Domínio | Variáveis |
|---|---|
| Banco | POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD |
| Auth Logto | LOGTO_ENDPOINT, LOGTO_APP_ID, LOGTO_APP_SECRET, LOGTO_COOKIE_SECRET, LOGTO_BASE_URL |
| URLs públicas | NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_PAINEL_URL |
| Pagamentos | INFINITEPAY_HANDLE |
| IA | OPENAI_API_KEY, IA_RESUMO_MAX_GERACOES_DIA |
| ETL Portal Transparência | PORTAL_TRANSPARENCIA_API_KEY |

### Variáveis presentes em app/.env.local mas sem evidência de consumo no runtime web atual

| Variável |
|---|
| AUTH_PROVIDER |
| RESEND_API_KEY, RESEND_FROM |
| GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET |
| LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET |
| CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET |

Observação: variáveis Cloudinary são consumidas por script ETL (upload_photos_cloudinary.py), não pelo app web identificado.

### Variáveis ausentes ou lacunas de contrato

| Lacuna | Impacto |
|---|---|
| Não há variável de assinatura/HMAC para webhook InfinitePay | Validação de autenticidade fica dependente de back-check, sem assinatura explícita |
| .env.example não documenta CLOUDINARY_* | Setup ETL de fotos pode falhar em novos ambientes |
| Sem pin explícito de versão Node/Python | Drift de ambiente entre máquinas/CI |

### Dependências de runtime

- Web: next, react, react-dom, pg, @logto/next, openai, zod, date-fns.
- ETL Python: requests, psycopg[binary], python-dotenv, python-dateutil, unidecode.

## 4. Banco de dados

| Item | Estado |
|---|---|
| Provider | PostgreSQL |
| ORM/client | Sem ORM; uso direto de pg no app e psycopg no ETL |
| Schema/migrations | db/schema.sql + db/migrations/*.sql |
| Config local de stack DB | db/config.toml (Supabase local tooling) |

### Tabelas principais observadas (uso recorrente)

- politicos, partidos, votacoes, gastos, presenca, emendas, perfis, acompanhamentos
- proposicoes, proposicao_autores, proposicao_tramitacoes
- feature_flags, admin_logs, analytics_eventos
- candidatos e tabelas de estados (estados_*)
- doacoes (migration 20260603000000_create_doacoes.sql + uso no webhook)

### Conexão esperada

- App: POSTGRES_* via pg Pool.
- ETL: POSTGRES_* (com alguns scripts aceitando fallback SUPABASE_DB_*).

## 5. Autenticação

| Item | Estado |
|---|---|
| Provider principal | Logto |
| Fluxos | sign-in, sign-up, reset-password, callback, sign-out em /api/auth/logto/* |
| Sessão | getLogtoContext (server) e cliente edge no proxy |
| RBAC | role em perfis (admin/user) validado em páginas e APIs admin |
| Reconciliação de identidade | perfis.logto_sub + fallback legado por email |

### Redirect/callback URIs

- Callback usado: /api/auth/logto/callback.
- Base URL dinâmica/fallback via LOGTO_BASE_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL.
- Host painel protegido por proxy para rotas autenticadas.

## 6. Integrações externas

### Matriz solicitada

| Integração | Evidência no projeto | Status operacional |
|---|---|---|
| Directus | Não encontrada em runtime/código de app; apenas menções externas/planejamento | Pendente/sem evidência ativa |
| Logto | Código ativo em lib/logto e api/auth/logto | Ativa |
| Brevo | Não encontrado | Sem evidência |
| SES | Não encontrado | Sem evidência |
| Resend | Variáveis em env e docs; sem consumo runtime web identificado | Parcial/documental |
| Vercel | vercel.json + docs de deploy | Ativa (alvo principal) |
| Coolify | Menções em docs (monitoring/roadmap/todo) | Referência operacional, sem config ativa no repo |
| Cloudflare | Sem integração de app direta; dependência transitiva pg-cloudflare no lockfile | Sem evidência ativa de uso |
| Postiz | Não encontrado | Sem evidência |
| n8n | Não encontrado | Sem evidência |
| InfinitePay | APIs de criação/verificação + webhook | Ativa |
| OpenAI | Server action + ETL IA | Ativa condicionada a chave |
| ViaCEP | Uso em componentes de estado/CEP | Ativa |
| APIs públicas (Câmara/Senado/TSE/IBGE/Portal/STN/ALE) | ETL por pastas dedicadas | Ativas via ETL |
| Cloudinary | Script ETL de upload de fotos | Ativa no ETL, não no runtime web |

## 7. Email

| Item | Estado |
|---|---|
| Provider ativo no runtime web | Não confirmado |
| Variáveis de email presentes | RESEND_API_KEY, RESEND_FROM |
| Templates de email | Não identificados no app |
| Remetentes | RESEND_FROM definido em template/local |
| Fluxos transacionais | Não identificados no código web |
| Logs/auditoria | Sem trilha de email dedicada identificada |

Conclusão: email parece preparado em env/documentação, mas não operacionalizado no runtime analisado.

## 8. Deploy

| Item | Identificado |
|---|---|
| Plataforma principal | Vercel |
| Install command | cd app && npm ci --include=optional && npm i --no-save ...binários tailwind/lightningcss |
| Build command | cd app && npm run build |
| Start command (local/prod server) | npm --prefix app run start |
| Output directory | app/.next |
| Domínios esperados | meuspoliticos.com.br, app.meuspoliticos.com.br, painel.meuspoliticos.com.br |
| Dockerfile/compose | Não encontrados |

Variáveis de produção: famílias críticas são POSTGRES_*, LOGTO_*, NEXT_PUBLIC_*, INFINITEPAY_HANDLE, OPENAI_API_KEY.

## 9. Segurança

### Secrets encontrados (nomes e localização, sem valores)

#### app/.env.local
- POSTGRES_PASSWORD
- LOGTO_APP_SECRET
- LOGTO_COOKIE_SECRET
- PORTAL_TRANSPARENCIA_API_KEY
- OPENAI_API_KEY
- RESEND_API_KEY
- GOOGLE_CLIENT_SECRET
- TWITTER_CLIENT_SECRET
- LINKEDIN_CLIENT_SECRET
- CLOUDINARY_API_SECRET

Também há chaves/IDs sensíveis de integração em app/.env.local:
- LOGTO_APP_ID, GOOGLE_CLIENT_ID, TWITTER_CLIENT_ID, LINKEDIN_CLIENT_ID, CLOUDINARY_API_KEY

#### docs/meuspoliticos_master.md
- RESEND_API_KEY aparece com placeholder (não valor real) nas linhas documentadas

### Riscos óbvios identificados

| Risco | Nível | Observação |
|---|---|---|
| Segredos reais em app/.env.local local | Alto | Esperado para ambiente local, mas exige proteção de máquina/backup e nunca versionar |
| Falta de assinatura explícita de webhook InfinitePay | Médio/Alto | Há back-check no payment_check, porém sem prova criptográfica de origem no endpoint |
| Múltiplas criações de Pool espalhadas no app | Médio | Risco de inconsistência de timeout/config/observabilidade |
| Ausência de monitoramento de erro em produção (Sentry etc.) | Médio | Erros dependem de logs manuais |
| Sem política CORS custom explícita no app | Baixo/Médio | Sem necessidade imediata para same-origin, mas faltam regras explícitas para endurecimento |

### CORS, webhooks e tokens

- CORS: não foi encontrada política CORS dedicada (headers custom) no runtime analisado.
- Webhooks: endpoint de InfinitePay existe e persiste doações; valida via payment_check.
- Tokens expostos no front: não há evidência de uso de segredos com prefixo NEXT_PUBLIC_ além de URLs.

## 10. Status operacional

### O que parece funcionando

- Estrutura web Next.js completa com rotas públicas, painel e admin.
- Auth Logto implementado ponta a ponta no código.
- Integração InfinitePay com criação de link, verificação e persistência em doacoes no webhook.
- Banco com migrations amplas e ETLs por domínio de dados públicos.
- Deploy alvo em Vercel bem definido (install/build/output).

### O que parece quebrado, incompleto ou inconsistente

- Endpoint admin de ETL (api/admin/etl/run) não executa coleta, só registra solicitação.
- Documentação de status/readiness tem divergências com código atual (ex.: webhook de pagamento antes estava descrito como sem persistência).
- Setup de email transacional não está comprovado em runtime.
- Sem version pin de Node/Python no repositório.
- Último comando local informado foi npm run dev com exit code 1 (causa não auditada neste inventário).

### O que precisa validação manual

- Login/callback/logout Logto em ambiente real com domínios de produção.
- Fluxo de apoio completo (criação de link, pagamento real, confirmação e leitura da doacao persistida).
- Permissões efetivas de banco em produção (least privilege e grants).
- Integridade e atualização das coletas ETL por fonte.
- Estado real de DNS/CDN (Cloudflare) e eventual operação complementar via Coolify.

## 11. Recomendações

### Próximos ajustes técnicos

1. Centralizar conexão PostgreSQL em módulo único e substituir Pool local repetido nas páginas/rotas.
2. Definir e implementar validação forte do webhook InfinitePay (assinatura/camada de confiança adicional).
3. Implementar orquestrador de ETL real (fila/cron/runner) com status, lock, timeout e logs sanitizados.
4. Adicionar monitoramento de erros e uptime (Sentry + health checks).
5. Padronizar ambiente com pin de Node e Python.
6. Alinhar documentação operacional com o estado real do código para eliminar drift.
7. Completar .env.example com variáveis usadas por ETL de mídia (CLOUDINARY_*), quando aplicável.

### Padronizações com outros projetos NORO

1. Contrato único de variáveis por ambiente (dev/staging/prod) com owner por variável.
2. Política de segredos: nunca em docs, scanner de segredo em CI e rotação periódica.
3. Padrão único de observabilidade (erro, uptime, auditoria, trilha de jobs).
4. Padrão único de deploy e rollback documentado por plataforma.

### Integrações sugeridas (Directus/Logto/Brevo/Postiz/n8n)

1. Directus: usar como camada editorial/backoffice para conteúdos não transacionais (notícias, páginas institucionais, glossário editorial).
2. Logto: manter como IdP central e formalizar matriz de roles/permissões por domínio (site/painel/admin).
3. Brevo (ou SES/Resend): escolher um provedor único e implementar trilha de eventos transacionais (delivery/bounce/complaint).
4. Postiz: usar para calendário de comunicação pública e sincronizar com conteúdo editorial.
5. n8n: usar para automações operacionais (alertas ETL, incidentes, sincronizações entre banco/admin/analytics).

## Pendências

1. Confirmar causa do exit code 1 do comando npm run dev no ambiente local atual.
2. Validar manualmente o fluxo financeiro ponta a ponta em ambiente controlado.
3. Definir operação real de ETL (runner/scheduler) além do registro em admin_logs.
4. Decidir e formalizar stack de email transacional ativa.
5. Definir owner e política para variáveis OAuth presentes em app/.env.local sem uso comprovado no runtime.
6. Confirmar se Cloudflare/Coolify fazem parte do ambiente ativo deste projeto ou apenas referência organizacional.
7. Publicar política explícita de CORS/headers de segurança (CSP, HSTS, etc.) para produção.

## Decisões sugeridas

1. Manter Logto como padrão oficial de autenticação e encerrar dependências legadas remanescentes de identidade.
2. Assumir Vercel como plataforma primária de runtime web e separar ETL para runner dedicado.
3. Tratar InfinitePay como integração financeira oficial com contrato de webhook endurecido e auditoria de doações.
4. Consolidar um único provedor de email transacional e remover variáveis/documentação de provedores não usados.
5. Institucionalizar scanner de segredos e baseline de observabilidade como gate de release.
