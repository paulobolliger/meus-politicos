---
file: docs/INVENTORY_ROUTES.md
module: Inventory Routes
status: Active
related: [README.md, docs/MVP_REAL_IDENTIFICADO.md, docs/PRODUCAO_READINESS.md, docs/API.md, docs/INVENTORY_API_CONSUMPTION.md, docs/PLACEHOLDER_REPORT.md]
---

# Inventory Routes

Data do inventario: 2026-06-02.

Este documento mapeia as rotas Next.js identificadas em `app/src/app`, seus objetivos, integracoes e classificacao de prontidao. A classificacao e baseada em leitura estatica do codigo; nenhuma rota foi testada em browser e nenhuma conexao ativa ao banco remoto/desconhecido foi executada.

## Legenda De Status

| Status | Definicao operacional |
|---|---|
| Funcional em codigo | Possui implementacao concreta, consulta dados reais ou executa acao real; ainda pode precisar de validacao runtime |
| Parcial | Implementa parte do fluxo, mas depende de dados ausentes, secoes incompletas, fallback silencioso ou validacao pendente |
| Placeholder | Rota/componente existe, mas comunica "em breve", usa mock ou nao entrega a promessa principal |
| Estatica | Pagina institucional/legal sem fluxo de dados critico |
| Nao validada | Implementacao existe, mas requer ambiente externo, callback, credencial ou pre-flight nao executado |
| Incompleta | Acao existe, mas tem TODO funcional ou nao persiste efeito critico |

## Resumo Executivo

| Grupo | Quantidade aproximada | Veredito |
|---|---:|---|
| Layouts | 7 | Estrutura App Router organizada por grupos `(site)`, `(app)`, `(painel)`, `(admin)`, `(auth)`, `(checkout)` |
| Paginas UI | 49 | Boa cobertura de produto, com core loop funcional e varias telas parciais |
| Route handlers API | 18 metodos HTTP | APIs reais para busca, auth Logto, acompanhamentos, admin, analytics e apoio |
| Rotas com Postgres direto | 25+ arquivos | O frontend server-side consulta banco diretamente com `pg` |
| Rotas com consumo `fetch` interno | 10+ componentes/rotas | Busca, admin, glossario, acompanhamento, analytics e apoio conectados |
| Rotas com placeholder/mock evidente | 10+ areas | Candidatos, estado, deputados estaduais, perfil app, painel auxiliar, pagamento/webhook |

## Hosts E Grupos De Rota

O codigo organiza a experiencia em grupos do App Router. O roteamento por subdominio e intermediado por `app/src/proxy.ts` e por URLs publicas:

| Grupo | Papel | Host esperado |
|---|---|---|
| `(site)` | Site publico institucional e produto aberto | `localhost:3000` / dominio principal |
| `(app)` | Experiencia analitica/app | `app.localhost:3000` / subdominio app |
| `(painel)` | Login/cadastro e dashboard autenticado | `painel.localhost:3000` / subdominio painel |
| `(admin)` | Backoffice interno | Mesmo app, rota `/admin`, role `admin` |
| `(checkout)` | Confirmacao de apoio/pagamento | Fluxo de checkout |
| `api` | APIs internas, auth Logto e webhooks | Mesmo host, prefixo `/api` |

## Matriz De Rotas UI

### Raiz E Layouts

| Rota/arquivo | Objetivo | Backend/dados | Frontend | Status producao |
|---|---|---|---|---|
| `app/src/app/layout.tsx` | Layout raiz global | Nao identificado no inventario | App shell global | Funcional em codigo |
| `app/src/app/loading.tsx` | Estado global de loading | Nao aplicavel | UI de carregamento | Funcional em codigo |
| `app/src/app/error.tsx` | Boundary de erro global | Nao aplicavel | UI de erro | Funcional em codigo |
| `app/src/app/not-found.tsx` | 404 global | Nao aplicavel | UI not found | Funcional em codigo |
| `(site)/layout.tsx` | Layout do site publico | Nao identificado no inventario | Header/footer site | Funcional em codigo |
| `(app)/layout.tsx` | Layout do app analitico | Nao identificado no inventario | App shell | Parcial |
| `(painel)/(dashboard)/layout.tsx` | Layout dashboard autenticado | Auth/session | Painel shell | Funcional em codigo |
| `(painel)/(auth)/layout.tsx` | Layout auth painel | Logto via rotas API | Auth shell | Funcional em codigo |
| `(admin)/admin/layout.tsx` | Layout admin | Auth/RBAC esperado | Admin shell/sidebar | Funcional em codigo, validar protecao |
| `(auth)/layout.tsx` | Layout auth auxiliar | Logto | Nao identificado em detalhe | Parcial |
| `(checkout)/layout.tsx` | Layout checkout | InfinitePay indireto | Confirmacao apoio | Parcial |

### Site Publico `(site)`

| Rota | Arquivo | Objetivo | Integracoes/dados | Status producao |
|---|---|---|---|---|
| `/` | `app/src/app/(site)/page.tsx` | Home publica com proposta do produto e votacoes recentes | PostgreSQL `votacoes`; componente `HomeCidadaoClient` | Funcional em codigo; validar runtime |
| `/busca` | `app/src/app/(site)/busca/page.tsx` | Busca publica de politicos | UI `BuscaClient`; chama `/api/busca` | Funcional em codigo; core MVP |
| `/politicos/[id]` | `app/src/app/(app)/politicos/[id]/page.tsx` | Perfil publico ou app de politico conforme host | PostgreSQL `politicos`, `partidos`, `votacoes`, `gastos`, `presenca`, `emendas`; `headers()` para distinguir host | Funcional em codigo; secoes parciais |
| `/projetos` | `app/src/app/(site)/projetos/page.tsx` | Lista publica de proposicoes/projetos | PostgreSQL `proposicoes`; filtros via query string | Funcional parcial |
| `/projetos/[slug]` | `app/src/app/(site)/projetos/[slug]/page.tsx` | Detalhe publico de projeto | PostgreSQL `proposicoes`, `proposicao_autores`, `proposicao_tramitacoes`, `votacoes` | Funcional parcial; historico detalhado em breve |
| `/partidos` | `app/src/app/(site)/partidos/page.tsx` | Lista de partidos | PostgreSQL `partidos`, fundos partidarios agregados | Funcional parcial |
| `/partidos/[sigla]` | `app/src/app/(site)/partidos/[sigla]/page.tsx` | Detalhe de partido | PostgreSQL `partidos`, `politicos`, `gastos`, `votacoes`; fetch externo em detalhe | Parcial; heatmap/coesao pode depender de dados |
| `/estado` | `app/src/app/(site)/estado/page.tsx` | Hub de estados | Config estatico de estados; mapa/links | Parcial; mapa interativo em breve |
| `/estado/[sigla]` | `app/src/app/(site)/estado/[sigla]/page.tsx` | Pagina estadual | PostgreSQL `estados_governos`, `estados_economia`, `estados_pacto_federativo`, `estados_tribunais`, `politicos`, `municipios`, `emendas`, `estados_timeline`, `estados_ale` | Funcional parcial |
| `/estado/[sigla]/assembleia` | `app/src/app/(site)/estado/[sigla]/assembleia/page.tsx` | Assembleia estadual | PostgreSQL `politicos`, `partidos` e dados ALE | Parcial; depende da cobertura ALE |
| `/estado/[sigla]/assembleia/[slug]` | `app/src/app/(site)/estado/[sigla]/assembleia/[slug]/page.tsx` | Perfil de deputado estadual | PostgreSQL `politicos`, colegas, dados estaduais/ALE | Parcial; emendas estaduais em breve e ratios placeholder |
| `/meu-estado` | `app/src/app/(site)/meu-estado/page.tsx` | Descoberta de representantes por localidade | Componentes `MeuEstadoContent`, ViaCEP/IBGE, PostgreSQL em componente server | Parcial; deputados estaduais/vereadores em breve |
| `/camara` | `app/src/app/(site)/camara/page.tsx` | Visao da Camara dos Deputados | PostgreSQL `politicos`, `partidos`, `gastos`, `votacoes`, `proposicoes` | Funcional parcial |
| `/cidades` | `app/src/app/(site)/cidades/page.tsx` | Consulta/lista de municipios | PostgreSQL `municipios` | Funcional parcial |
| `/candidatos-2026` | `app/src/app/(site)/candidatos-2026/page.tsx` | Lista de candidatos 2026 | PostgreSQL `candidatos`; catch para tabela ausente | Parcial; depende de ETL/tabela |
| `/candidatos-2026/[slug]` | `app/src/app/(site)/candidatos-2026/[slug]/page.tsx` | Detalhe de candidato | PostgreSQL `candidatos`; tentativa `candidatos_bens`; cliente com links `href="#"` | Parcial; links inativos e bens dependentes |
| `/glossario` | `app/src/app/(site)/glossario/page.tsx` | Glossario civico | PostgreSQL `glossario` | Funcional em codigo |
| `/glossario/[slug]` | `app/src/app/(site)/glossario/[slug]/page.tsx` | Verbete do glossario | PostgreSQL `glossario` e relacionados | Funcional parcial; contexto legal placeholder |
| `/apoio` | `app/src/app/(site)/apoio/page.tsx` | Captacao de apoio/doacao | Cliente chama `/api/apoio/criar-link`; InfinitePay | Parcial; PIX placeholder e webhook sem persistencia |
| `/apoio/confirmacao` | `app/src/app/(checkout)/apoio/confirmacao/page.tsx` | Confirmacao pos checkout | Nao identificado em detalhe | Nao validada |
| `/confirmacao` | `app/src/app/(site)/confirmacao/page.tsx` | Confirmacao site | Nao identificado em detalhe | Parcial/estatica |
| `/sobre` | `app/src/app/(site)/sobre/page.tsx` | Institucional | Conteudo estatico | Estatica |
| `/fontes` | `app/src/app/(site)/fontes/page.tsx` | Fontes de dados | Conteudo estatico e "fontes em breve" | Estatica/parcial |
| `/metodologia` | `app/src/app/(site)/metodologia/page.tsx` | Metodologia do produto | Conteudo estatico | Estatica |
| `/manifesto` | `app/src/app/(site)/manifesto/page.tsx` | Manifesto de produto | Conteudo estatico | Estatica |
| `/como-funciona` | `app/src/app/(site)/como-funciona/page.tsx` | Explicacao do produto | Conteudo estatico | Estatica |
| `/termos` | `app/src/app/(site)/termos/page.tsx` | Termos de uso | Conteudo estatico | Estatica |
| `/privacidade` | `app/src/app/(site)/privacidade/page.tsx` | Politica de privacidade | Conteudo estatico | Estatica |
| `/acesso-negado` | `app/src/app/(site)/acesso-negado/page.tsx` | Erro de autorizacao | Nao aplicavel | Funcional em codigo |
| `/erro` | `app/src/app/(site)/erro/page.tsx` | Pagina de erro | Botao recarregar | Funcional em codigo |
| `/manutencao` | `app/src/app/(site)/manutencao/page.tsx` | Manutencao | Conteudo estatico | Estatica |
| `/indisponivel` | `app/src/app/(site)/indisponivel/page.tsx` | Indisponibilidade | Conteudo estatico | Estatica |

### App Analitico `(app)`

| Rota | Arquivo | Objetivo | Integracoes/dados | Status producao |
|---|---|---|---|---|
| `/home` | `app/src/app/(app)/home/page.tsx` | Home do app analitico | `HomeApp` | Placeholder/parcial; componente possui dados mock |
| `/app-busca` | `app/src/app/(app)/app-busca/page.tsx` | Busca no contexto app | Nao identificado em detalhe; provavel reutilizacao de busca | Parcial |
| `/comparar` | `app/src/app/(app)/comparar/page.tsx` | Comparacao de politicos | PostgreSQL direto; `CompararClient` usa `/api/busca` para adicionar politicos | Funcional parcial |
| `/proposicoes` | `app/src/app/(app)/proposicoes/page.tsx` | Lista app de proposicoes | PostgreSQL `proposicoes` | Funcional parcial |
| `/proposicoes/[slug]` | `app/src/app/(app)/proposicoes/[slug]/page.tsx` | Detalhe app de proposicao | PostgreSQL `proposicoes`, `proposicao_autores` | Funcional parcial |
| `/politicos/[id]` | `app/src/app/(app)/politicos/[id]/page.tsx` | Perfil app/site por host | PostgreSQL amplo; `PerfilApp` ou `PerfilSite` | Funcional parcial |

### Painel Autenticado `(painel)`

| Rota | Arquivo | Objetivo | Integracoes/dados | Status producao |
|---|---|---|---|---|
| `/login` | `app/src/app/(painel)/(auth)/login/page.tsx` | Entrada de login | Form `LoginForm`, redireciona para `/api/auth/logto/sign-in` | Funcional em codigo; validar Logto |
| `/cadastro` | `app/src/app/(painel)/(auth)/cadastro/page.tsx` | Cadastro | Form `CadastroForm`, redireciona para `/api/auth/logto/sign-up` | Funcional em codigo; validar Logto |
| `/recuperar-senha` | `app/src/app/(painel)/(auth)/recuperar-senha/page.tsx` | Recuperacao de senha | Redireciona para `/api/auth/logto/reset-password` | Funcional em codigo; validar Logto |
| `/recuperar-senha/confirmar` | `app/src/app/(painel)/(auth)/recuperar-senha/confirmar/page.tsx` | Confirmacao de recuperacao | Logto | Nao validada |
| `/painel` | `app/src/app/(painel)/(dashboard)/painel/page.tsx` | Dashboard do usuario | Auth Logto/current-user; PostgreSQL `perfis`, `acompanhamentos`, `politicos`, `partidos`, `votacoes`, `gastos` | Funcional em codigo; core MVP |
| `/meus-politicos` | `app/src/app/(painel)/(dashboard)/meus-politicos/page.tsx` | Lista de politicos acompanhados | Esperado: `acompanhamentos`/politicos | Parcial; validar detalhe |

### Admin `(admin)`

| Rota | Arquivo | Objetivo | Integracoes/dados | Status producao |
|---|---|---|---|---|
| `/admin` | `app/src/app/(admin)/admin/page.tsx` | Dashboard administrativo | PostgreSQL contagens de `politicos`, `emendas`, `gastos`, `votacoes`, `proposicoes`, `municipios`; `coletas_log`; usuarios novos | Funcional parcial; validar RBAC |
| `/admin/usuarios` | `app/src/app/(admin)/admin/usuarios/page.tsx` | Gestao/lista de usuarios | PostgreSQL `perfis`, filtros por email | Funcional parcial |
| `/admin/flags` | `app/src/app/(admin)/admin/flags/page.tsx` | Feature flags | PostgreSQL `feature_flags`; componente chama `/api/admin/flags` | Funcional em codigo |
| `/admin/dados` | `app/src/app/(admin)/admin/dados/page.tsx` | Saude/diagnostico de dados | PostgreSQL e analises de orfaos | Funcional parcial |
| `/admin/etl` | `app/src/app/(admin)/admin/etl/page.tsx` | Painel de fontes ETL | PostgreSQL `coletas_log`; componente chama `/api/admin/etl/run` | Parcial; trigger real incompleto |
| `/admin/analytics` | `app/src/app/(admin)/admin/analytics/page.tsx` | Analytics interno | PostgreSQL `analytics_eventos` | Funcional parcial |

## Matriz De APIs

| Endpoint | Metodo | Arquivo | Objetivo | Consumidor identificado | Banco/externo | Status producao |
|---|---|---|---|---|---|---|
| `/api/busca` | GET | `app/src/app/api/busca/route.ts` | Buscar politicos paginados/filtros | `BuscaClient`, `CompararClient`, `MatchEmendaButton` | PostgreSQL `politicos`, `partidos` | Funcional em codigo |
| `/api/glossario/[slug]` | GET | `app/src/app/api/glossario/[slug]/route.ts` | Buscar definicao para tooltip | `GlossarioTooltip` | PostgreSQL `glossario` | Funcional em codigo |
| `/api/analytics` | POST | `app/src/app/api/analytics/route.ts` | Registrar evento client-side | `app/src/lib/analytics.ts` | PostgreSQL `analytics_eventos` | Funcional parcial |
| `/api/acompanhamentos` | POST | `app/src/app/api/acompanhamentos/route.ts` | Seguir politico | `BotaoAcompanhar` | Auth + PostgreSQL `acompanhamentos` | Funcional em codigo |
| `/api/acompanhamentos` | GET | `app/src/app/api/acompanhamentos/route.ts` | Listar politicos seguidos | Nenhum consumidor UI direto identificado no inventario; painel le banco direto | Auth + PostgreSQL `acompanhamentos` | API real, consumo parcial |
| `/api/acompanhamentos/[politicoId]` | DELETE | `app/src/app/api/acompanhamentos/[politicoId]/route.ts` | Deixar de seguir politico | `BotaoAcompanhar` | Auth + PostgreSQL `acompanhamentos` | Funcional em codigo |
| `/api/admin/politicos/[id]` | PATCH | `app/src/app/api/admin/politicos/[id]/route.ts` | Editar dados de politico | `PoliticoEditorSection` | Auth admin + PostgreSQL + `admin_logs` | Funcional parcial |
| `/api/admin/flags` | PATCH | `app/src/app/api/admin/flags/route.ts` | Atualizar feature flag | `FeatureFlagList` | Auth admin + PostgreSQL `feature_flags`, `admin_logs` | Funcional em codigo |
| `/api/admin/emendas/match` | PATCH | `app/src/app/api/admin/emendas/match/route.ts` | Vincular emenda a politico | `MatchEmendaButton` | Auth admin + PostgreSQL `emendas`, `admin_logs` | Funcional parcial |
| `/api/admin/etl/run` | POST | `app/src/app/api/admin/etl/run/route.ts` | Solicitar execucao de ETL | `EtlSourceCard` | Auth admin + PostgreSQL `admin_logs` | Incompleta; nao dispara ETL real |
| `/api/apoio/criar-link` | POST | `app/src/app/api/apoio/criar-link/route.ts` | Criar checkout InfinitePay | `/apoio` | InfinitePay API externa | Funcional parcial; depende de provedor |
| `/api/apoio/verificar-pagamento` | POST | `app/src/app/api/apoio/verificar-pagamento/route.ts` | Verificar pagamento InfinitePay | Nenhum consumidor UI identificado | InfinitePay API externa | API fantasma/nao validada |
| `/api/webhooks/infinitepay` | POST | `app/src/app/api/webhooks/infinitepay/route.ts` | Receber webhook de pagamento | InfinitePay externo | Sem persistencia; console log | Incompleta |
| `/api/auth/logto/sign-in` | GET | `app/src/app/api/auth/logto/sign-in/route.ts` | Iniciar login Logto | `LoginForm` | Logto | Funcional em codigo; validar runtime |
| `/api/auth/logto/sign-up` | GET | `app/src/app/api/auth/logto/sign-up/route.ts` | Iniciar cadastro Logto | `CadastroForm` | Logto | Funcional em codigo; validar runtime |
| `/api/auth/logto/sign-out` | GET | `app/src/app/api/auth/logto/sign-out/route.ts` | Logout Logto | `BotaoSair` | Logto | Funcional em codigo; validar runtime |
| `/api/auth/logto/reset-password` | GET | `app/src/app/api/auth/logto/reset-password/route.ts` | Fluxo de reset Logto | `RecuperarSenhaForm` | Logto | Funcional em codigo; validar runtime |
| `/api/auth/logto/callback` | GET | `app/src/app/api/auth/logto/callback/route.ts` | Callback pos-auth | Logto externo | Logto + perfil linking posterior | Funcional em codigo; validar runtime |

## Rotas Criticas Para Validacao End-To-End

### Fluxo publico de busca e perfil

| Passo | Rota/API | Resultado esperado |
|---|---|---|
| 1 | `/` | Home renderiza e mostra votacoes recentes se houver dados |
| 2 | `/busca?q=...` | UI chama `/api/busca` e lista politicos |
| 3 | `/politicos/[id]` | Perfil renderiza dados principais, votacoes, gastos, presenca e emendas |

### Fluxo autenticado de acompanhamento

| Passo | Rota/API | Resultado esperado |
|---|---|---|
| 1 | `/politicos/[id]?follow=1` | Usuario nao logado e redirecionado para login |
| 2 | `/login` -> `/api/auth/logto/sign-in` | Logto autentica e retorna |
| 3 | `/api/acompanhamentos` POST | Cria registro em `acompanhamentos` |
| 4 | `/painel` | Lista politico seguido e feed civico |
| 5 | `/api/acompanhamentos/[politicoId]` DELETE | Remove acompanhamento |

### Fluxo admin

| Passo | Rota/API | Resultado esperado |
|---|---|---|
| 1 | `/admin` | Apenas admin acessa dashboard |
| 2 | `/admin/flags` -> `/api/admin/flags` PATCH | Flag atualizada e log registrada |
| 3 | `/admin/dados` | Diagnostico de dados renderizado |
| 4 | `/admin/etl` -> `/api/admin/etl/run` POST | Registra solicitacao; nao executa ETL real hoje |

### Fluxo apoio/pagamento

| Passo | Rota/API | Resultado esperado |
|---|---|---|
| 1 | `/apoio` | Usuario informa dados e valor |
| 2 | `/api/apoio/criar-link` POST | Retorna URL InfinitePay |
| 3 | `/api/webhooks/infinitepay` POST | Hoje apenas loga; deveria persistir doacao |
| 4 | `/apoio/confirmacao` | Confirma visualmente retorno, mas reconciliacao com banco nao foi comprovada |

## Rotas Com Risco De Promessa Maior Que Implementacao

| Rota/area | Risco |
|---|---|
| `/apoio` | Pagamento pode parecer completo, mas webhook nao persiste |
| `/admin/etl` | Botao de rodar ETL registra acao, mas nao dispara ETL real |
| `/candidatos-2026/[slug]` | Ha links `href="#"` e chat/input placeholder |
| `/estado` | Mapa interativo indicado como em breve |
| `/estado/[sigla]` | Deputados estaduais/vereadores podem aparecer como dados em breve |
| `/partidos/[sigla]` | Heatmap e coesao dependem de dados e possuem placeholder |
| `/home` no app | `HomeApp` usa dados mockados |
| Perfil app | Comissoes e algumas secoes estao em breve |

## Conclusao

A matriz de rotas confirma que o produto ja tem um nucleo navegavel real: home, busca, perfil, acompanhamento e painel. A producao plena depende de validar runtime, reduzir placeholders que geram promessa enganosa, persistir pagamentos, definir execucao real de ETL e documentar APIs/tabelas consumidas nos proximos lotes.

