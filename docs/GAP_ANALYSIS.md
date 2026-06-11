---
file: docs/GAP_ANALYSIS.md
module: Gap Analysis
status: Active
related: [docs/PLACEHOLDER_REPORT.md, docs/MVP_REAL_IDENTIFICADO.md, docs/PRODUCAO_READINESS.md, docs/TODO_PRODUCTION.md, docs/SECURITY.md, docs/INVENTORY_ROUTES.md, docs/INVENTORY_FEATURES.md]
---

# Gap Analysis

Data da consolidacao: 2026-06-02.

Branch auditada: `feat/acompanhamentos-logto`.

Base de analise: inventario estatico local, sem conexao ativa ao banco remoto/desconhecido. A conexao definida em `app/.env.local` foi classificada como host remoto/desconhecido e o pre-flight foi abortado por seguranca.

Este documento preserva gaps historicos relevantes do `GAP_ANALYSIS.md` anterior, mas atualiza o veredito para o runtime atual: Next.js 16, Logto como identidade ativa em codigo, PostgreSQL direto via `pg` e InfinitePay como fluxo de apoio ativo. Problemas visuais detalhados ficam em `docs/PLACEHOLDER_REPORT.md`; este arquivo foca em fraturas de engenharia, riscos operacionais, dados e producao.

## Resumo Executivo

| Area | Veredito |
|---|---|
| Produto | Core loop real existe, mas ha promessas expostas acima da implementacao |
| Pagamentos | Bloqueio P0/P1: webhook InfinitePay nao persiste doacao |
| ETL | Bloqueio P1: admin registra solicitacao, mas nao dispara scripts Python |
| Seguranca | Bloqueio P0: segredo aparente em documentacao legada |
| Banco | Schema amplo e usado, mas pre-flight ativo nao validado |
| Auth | Logto implementado em codigo; runtime end-to-end ainda precisa validacao |
| Observabilidade | Analytics interno basico; sem monitoramento robusto confirmado |
| Testes/CI | Sem workflows `.github/workflows`; cobertura automatizada nao identificada |

## Tabela Oficial De Gaps

| ID | Gap | Severidade | Evidencia | Impacto | Status |
|---|---|---|---|---|---|
| G-01 | Segredo aparente em documentacao legada | P0 | `docs/meuspoliticos_master.md:229`, `docs/meuspoliticos_master.md:264` | Risco de abuso de API, incidente de seguranca e necessidade de rotacao | Resolvido |
| G-02 | Webhook InfinitePay nao persiste doacao | P0/P1 | `app/src/app/api/webhooks/infinitepay/route.ts:34-45` | Pagamento confirmado nao vira registro em banco; perda de historico financeiro | Resolvido |
| G-03 | Webhook InfinitePay sem autenticidade robusta | P1 | `app/src/app/api/webhooks/infinitepay/route.ts:27`, `docs/API.md:251` | Payload falso/replay pode ser aceito se tiver NSUs | Resolvido |
| G-04 | Admin ETL nao executa scripts Python | P1 | `app/src/app/api/admin/etl/run/route.ts:43`, `app/src/app/api/admin/etl/run/route.ts:53` | Botao de ETL apenas registra log; dados nao atualizam | Resolvido |
| G-05 | Sem `.github/workflows` | P1 | `Test-Path .github/workflows` retornou `False` | Sem CI/CD/cron ETL confirmado | Aberto |
| G-06 | Pre-flight de banco abortado | P1 | `app/.env.local` classificado como remoto/desconhecido | Nao ha prova runtime de conectividade, grants e dados | Aberto |
| G-07 | Multiplas conexoes Postgres duplicadas | P2 | `new Pool` em 25+ arquivos | Risco de inconsistencia de config, pool excessivo e manutencao dificil | Parcial |
| G-08 | Respostas de erro expõem `pgError.message`/`code` | P2 | APIs admin/acompanhamentos retornam erro Postgres | Pode vazar detalhes internos e facilitar troubleshooting indevido | Parcial |
| G-09 | `auth.users` legado ainda participa do linking | P1/P2 | `app/src/lib/auth/profile-linking.ts` consulta `auth.users` | Migração Logto decupada de fkeys e auto-provisionamento implementado | Resolvido |
| G-10 | Analytics sem observabilidade operacional | P2 | `/api/analytics`, `analytics_eventos`, sem monitoramento externo confirmado | Erros de producao e webhooks podem ficar invisiveis | Aberto |
| G-11 | Agenda e alertas do painel usam dados estaticos | P1/P2 | `AlertasList.tsx:10`, `ProximasVotacoes.tsx:11` | Usuario pode ver alertas/votacoes ficticias | Resolvido |
| G-12 | Links inativos e botoes sem acao em UI | P1/P2 | Ver `PLACEHOLDER_REPORT.md` | UX quebrada, promessa falsa | Resolvido |
| G-13 | Paginas de candidatos 2026 dependem de tabela opcional | P2 | Codigo captura ausencia de `candidatos_bens` | Dados patrimoniais podem nao existir em runtime | Aberto |
| G-14 | Ausencia de testes automatizados identificados | P1 | Nenhuma suite/test runner consolidado no inventario | Regressao invisivel em auth, pagamentos, ETL e APIs | Aberto |
| G-15 | README raiz desatualizado | P2 | README antigo mencionava Supabase Auth/legado | Confundia setup e arquitetura | Resolvido no Lote 1 |
| G-16 | Falta de inventario de rotas/features | P2 | Documentos nao existiam | Dificultava handoff e priorizacao | Resolvido no Lote 2 |
| G-19 | Artefatos temporarios `.txt` dentro de `app/` | P2 | `app/temp_analysis.txt`, `app/temp_text_only.txt`, `app/temp_structure.txt`, `app/temp_clean_text.txt` | Ruido em inventario, handoff e buscas tecnicas | Aberto; arquivamento requer confirmacao humana |
| G-20 | Matriz CSV de wireframes fora da documentacao canonica | P3 | `docs/stitch_wireframes_match.csv` | Drift documental entre matriz historica e manuais atuais | Aberto; arquivamento requer confirmacao humana |

## Artefatos TXT/CSV Avulsos

| Arquivo | Diagnostico | Impacto | Acao Recomendada |
|---|---|---|---|
| `docs/stitch_wireframes_match.csv` | CSV documental que cruza wireframes com rotas e status (`match-direto`, `match-parcial`, `gap`, `nao-pagina`). Nao e massa de dados de banco. Contem backlog historico de produto/design, incluindo suite de inteligencia, FAQ, sustentabilidade, portais de transparencia e paginas parcialmente mapeadas. | Alto valor como evidencia historica, mas duplica informacoes que agora foram incorporadas nos manuais canonicos. Pode gerar divergencia se mantido como fonte paralela. | Manter ate validacao de rastreabilidade; depois arquivar em `docs/archive/` `[REQUER_CONFIRMAÇÃO_HUMANA]`. |
| `requirements.txt` | Manifesto tecnico de dependencias Python para ETL (`requests`, `psycopg[binary]`, `python-dotenv`, `python-dateutil`, `unidecode`). | Corrige a leitura de que ha uma referencia raiz de dependencias Python; ainda falta orquestracao formal e acoplamento claro aos scripts `etl/`. | Manter; alinhar com documentacao de ETL e scripts de deploy. |
| `app/temp_analysis.txt` | Export temporario/HTML do wireframe "App / Painel civico pessoal (logado)". | Polui a arvore `app/`, pode ser confundido com artefato operacional e nao deve participar de build ou inventario de codigo. | Arquivar em `docs/archive/` ou remover apos revisao `[REQUER_CONFIRMAÇÃO_HUMANA]`. |
| `app/temp_text_only.txt` | Variante textual temporaria do mesmo wireframe. | Mesmo risco de ruido documental dentro da aplicacao. | Arquivar em `docs/archive/` ou remover apos revisao `[REQUER_CONFIRMAÇÃO_HUMANA]`. |
| `app/temp_structure.txt` | Variante estrutural/HTML temporaria, com payload visual/fonte sem uso operacional. | Mesmo risco, agravado pelo volume e pelo conteudo de markup nao canonico. | Arquivar em `docs/archive/` ou remover apos revisao `[REQUER_CONFIRMAÇÃO_HUMANA]`. |
| `app/temp_clean_text.txt` | Variante limpa temporaria do wireframe. | Mesmo risco de fonte paralela. | Arquivar em `docs/archive/` ou remover apos revisao `[REQUER_CONFIRMAÇÃO_HUMANA]`. |

### G-19. Artefatos Temporarios Dentro De `app/`

Os arquivos `app/temp_analysis.txt`, `app/temp_text_only.txt`, `app/temp_structure.txt` e `app/temp_clean_text.txt` nao sao codigo, seed, migration, schema ou documentacao canonica. Eles pertencem ao historico de design/produto e devem sair da arvore da aplicacao para reduzir ruido em buscas, auditorias e handoffs tecnicos.

Prioridade: P2.

Acao: arquivar em `docs/archive/` ou remover apos confirmacao humana `[REQUER_CONFIRMAÇÃO_HUMANA]`.

### G-20. Matriz De Wireframes Fora Da Documentacao Canonica

`docs/stitch_wireframes_match.csv` registra uma matriz util de wireframes x rotas, mas a verdade operacional passa a estar distribuida nos manuais `BUSINESS_DOMAIN.md`, `INVENTORY_ROUTES.md`, `INVENTORY_FEATURES.md`, `DESIGN.md` e neste `GAP_ANALYSIS.md`. Enquanto o CSV continuar ativo, qualquer alteracao futura de rota pode gerar drift documental.

Prioridade: P3.

Acao: manter somente como evidencia historica ate revisao humana e depois arquivar em `docs/archive/` `[REQUER_CONFIRMAÇÃO_HUMANA]`.

## Gaps P0

### G-01. Segredo aparente em documentacao legada

Severidade: **P0**.

Evidencia:

| Arquivo:linha | Problema |
|---|---|
| `docs/meuspoliticos_master.md:229` | Valor aparente de `RESEND_API_KEY` |
| `docs/meuspoliticos_master.md:264` | Mesmo valor aparente repetido |

O valor nao deve ser reproduzido em relatorios, commits, issues ou logs. A presenca em documentacao legada exige resposta de seguranca, mesmo que a chave ja esteja revogada.

Impacto:

- risco de envio abusivo de e-mails;
- risco reputacional;
- necessidade de rotacao;
- necessidade de varredura historica conforme Regra 13;
- documentacao legada nao pode ser arquivada/removida sem confirmacao humana.

Acoes:

1. Rotacionar a chave no Resend.
2. Remover o valor do documento, substituindo por placeholder.
3. Executar varredura historica Git de segredos.
4. Registrar mitigacao em `docs/SECURITY.md`.
5. Se houver remocao/arquivamento de documento, marcar como `[REQUER_CONFIRMAÇÃO_HUMANA]`.

### G-02. Webhook InfinitePay nao persiste doacao

Severidade: **P0/P1**.

Evidencia:

| Arquivo:linha | Observacao |
|---|---|
| `app/src/app/api/webhooks/infinitepay/route.ts:27` | Valida apenas `order_nsu` e `transaction_nsu` |
| `app/src/app/api/webhooks/infinitepay/route.ts:34` | `TODO: registrar doação no banco de dados` |
| `app/src/app/api/webhooks/infinitepay/route.ts:35-45` | Pseudo-upsert em `doacoes` comentado |
| `app/src/app/api/webhooks/infinitepay/route.ts:47` | Evento confirmado vai para `console.log` |
| `docs/TODO_PRODUCTION.md:76-86` | Pendencia ja registrada para InfinitePay |

O fluxo ativo de apoio cria link via `/api/apoio/criar-link`, recebe `order_nsu` e configura `webhook_url` para `/api/webhooks/infinitepay`. Entretanto, quando o webhook chega, a aplicacao nao grava nada.

Impacto:

- nao existe historico confiavel de doacoes;
- usuario pode pagar sem que o sistema reconheca a doacao;
- time nao consegue conciliar receita;
- impossibilidade de relatorios de apoiadores;
- risco de atendimento/compliance;
- LGPD fica mal definida porque dados transacionais sao logados, mas nao governados em tabela com politica clara.

Contrato minimo recomendado:

| Campo | Origem | Persistencia recomendada |
|---|---|---|
| `order_nsu` | Criado em `/api/apoio/criar-link` | Chave idempotente/unica |
| `transaction_nsu` | Payload webhook | Identificador transacional |
| `invoice_slug` | Payload webhook | Referencia InfinitePay |
| `amount` | Payload webhook | Valor esperado |
| `paid_amount` | Payload webhook | Valor efetivamente pago |
| `capture_method` | Payload webhook | Metodo/canal |
| `receipt_url` | Payload webhook | Recibo |
| `tipo` | Parse de `order_nsu` | `mensal` ou `unica` |
| `status` | Evento recebido | `pago` inicialmente |
| `pago_em` | `now()` | Timestamp de confirmacao |
| `raw_payload` | Payload completo | JSONB para auditoria |

Acao tecnica:

1. Criar migration para `doacoes` se a tabela ainda nao existir.
2. Implementar `Pool`/query Postgres no webhook, nao pseudo-Supabase.
3. Usar `INSERT ... ON CONFLICT (order_nsu) DO UPDATE`.
4. Retornar `200` somente apos persistencia bem-sucedida.
5. Em erro de banco, retornar `400`/`500` conforme contrato de retry da InfinitePay.
6. Adicionar teste unitario/integração do webhook.

### G-03. Webhook InfinitePay sem verificacao de autenticidade robusta

Severidade: **P1**.

Evidencia:

| Arquivo:linha | Observacao |
|---|---|
| `app/src/app/api/webhooks/infinitepay/route.ts:27` | Rejeita apenas payload sem `order_nsu` ou `transaction_nsu` |
| `docs/API.md:251` | Documentacao aponta ausencia de verificacao de assinatura |
| `docs/SECURITY.md:114-118` | Risco ja reconhecido em seguranca |

Impacto:

- payload falso pode ser aceito se contiver campos obrigatorios;
- replay de webhook pode duplicar atualizacoes sem idempotencia;
- sem validacao por IP/HMAC, a origem do evento nao e comprovada.

Acao:

1. Verificar documentacao oficial InfinitePay sobre assinatura/HMAC/IP allowlist.
2. Implementar idempotencia mesmo antes do HMAC.
3. Logar tentativas invalidas em tabela/observabilidade.
4. Documentar fallback se o provedor nao oferecer assinatura.

## Gaps P1

### G-04. Admin ETL nao executa scripts Python

Severidade: **P1**.

Evidencia:

| Arquivo:linha | Observacao |
|---|---|
| `app/src/app/api/admin/etl/run/route.ts:43` | Insere acao em `admin_logs` |
| `app/src/app/api/admin/etl/run/route.ts:53` | Retorna `Trigger manual via SSH em breve` |
| `app/src/components/admin/EtlSourceCard.tsx:60` | Frontend chama `/api/admin/etl/run` |
| `etl/*` | Scripts Python reais existem para Camara, Senado, TSE, ALE, IBGE, STN, Portal da Transparencia |

O backoffice oferece uma acao de ETL, mas ela nao dispara nenhum processo. A API registra somente a intencao:

```sql
INSERT INTO admin_logs (usuario_id, acao, entidade, entidade_id, detalhe)
```

Impacto:

- administrador acredita que acionou coleta, mas dados nao mudam;
- dados ficam obsoletos;
- auditoria de `admin_logs` pode sugerir execucoes que nunca ocorreram;
- UX interna cria falsa confianca operacional.

Modelos possiveis de correcao:

| Modelo | Pro | Contra |
|---|---|---|
| Job runner interno | Feedback direto no admin | Complexidade e risco em ambiente serverless |
| GitHub Actions dispatch | Boa separacao operacional | Requer workflow e token seguro |
| Worker/queue externa | Escalavel e observavel | Mais infra |
| Manter manual e renomear UI | Menor risco imediato | Nao resolve automacao |

Acao minima antes de producao:

1. Renomear botao para "Registrar solicitacao" se nao executar ETL.
2. Mostrar status real: `solicitado`, `em_execucao`, `concluido`, `falhou`.
3. Criar pipeline real ou workflow para pelo menos Camara/Senado/Emendas.
4. Atualizar `coletas_log` apos execucao real.

### G-05. Sem workflows `.github/workflows`

Severidade: **P1**.

Evidencia: `Test-Path .github/workflows` retornou `False`.

Impacto:

- sem CI de build/lint/test;
- sem cron ETL;
- sem guardrail de regressao;
- documentacao que mencione automacao de ETL fica divergente do repo.

Workflows minimos recomendados:

| Workflow | Objetivo |
|---|---|
| `ci.yml` | `npm install`, lint, build |
| `etl-camara.yml` | Coleta Camara em agenda definida |
| `etl-senado.yml` | Coleta Senado em agenda definida |
| `etl-emendas.yml` | Portal da Transparencia e SIAFI |
| `secret-scan.yml` | Varredura de segredos em PR |

### G-06. Pre-flight de banco abortado

Severidade: **P1**.

Evidencia: `app/.env.local` foi classificado como `remote-dev-unknown`, com senha presente e host nao-local. A regra P0 impediu conexao ativa.

Impacto:

- nao ha evidencia runtime de que as queries atuais funcionam;
- nao ha prova de grants/RLS;
- nao ha prova de que migrations e codigo estao alinhados;
- build pode falhar se variaveis de ambiente estiverem inconsistentes.

Acao:

1. Criar ambiente local/dev explicitamente seguro.
2. Rodar `SELECT 1` com timeout 5s.
3. Validar existencia das tabelas centrais.
4. Validar uma consulta por fluxo: busca, perfil, painel, admin, analytics.

### G-09. Dependencia residual de `auth.users` (Resolvido)

Severidade: **P1/P2**.

Resolução:
1. Adicionado o auto-provisionamento de perfis novos com `createProfileForLogtoUserPostgres` em `profile-linking.ts`.
2. Adicionado o trigger automático no runtime em `current-user.ts` para criar um registro em `public.perfis` se o usuário Logto não tiver correspondência legada.
3. Criada a migration `20260602000000_remove_auth_users_fkeys.sql` para remover as constraints `perfis_id_fkey` e `acompanhamentos_usuario_id_fkey` que ligavam o banco ao `auth.users` legado do Supabase.

### G-11. Dados estaticos operacionais no painel

Severidade: **P1/P2**.

Evidencia:

| Arquivo:linha | Problema |
|---|---|
| `app/src/components/painel/AlertasList.tsx:10` | Alertas iniciais hardcoded |
| `app/src/components/painel/AlertasList.tsx:46` | Botao `+ NOVO` sem handler |
| `app/src/components/painel/ProximasVotacoes.tsx:11` | Base fixa de votacoes |
| `app/src/components/painel/ProximasVotacoes.tsx:17` | Label fixa `16.MAI 10h` |
| `app/src/components/painel/ProximasVotacoes.tsx:23` | Label fixa `17.MAI 14h` |

Impacto:

- o painel pode mostrar agenda falsa;
- alertas parecem configuraveis, mas sao estado local;
- contagem do painel nao representa banco.

Acao:

1. Remover `ProximasVotacoes` ate existir fonte real ou conectar fonte real.
2. Persistir alertas por usuario ou ocultar configuracao.
3. Nao exibir datas hardcoded.

### G-14. Ausencia de testes automatizados identificados

Severidade: **P1**.

Impacto:

- pagamentos sem teste de idempotencia;
- auth Logto sem teste de callback/reconciliacao;
- busca sem teste de contrato;
- admin sem teste RBAC;
- ETL sem teste de parsing/carga.

Suite minima:

| Area | Teste minimo |
|---|---|
| `/api/busca` | Query vazia, filtro por cargo, paginacao |
| `/api/acompanhamentos` | 401, insert, duplicidade, delete |
| Logto linking | perfil por `logto_sub`, fallback legado, usuario sem perfil |
| InfinitePay webhook | payload valido, invalido, duplicado |
| Admin | usuario comum recebe 403 |

## Gaps P2

### G-07. Duplicacao de conexao Postgres

Severidade: **P2**.

Evidencia: `new Pool` aparece em muitos arquivos, incluindo paginas publicas, admin, APIs, painel e actions.

Impacto:

- configuracao inconsistente (`5432` vs `5433`);
- risco de pool excessivo;
- dificil aplicar SSL, timeout, logging e retry de forma uniforme;
- maior chance de divergencia entre ambientes.

Acao:

1. Criar helper unico `getPgPool()` em `app/src/lib/db`.
2. Centralizar host/port/db/user/password/SSL/timeouts.
3. Reusar tipos e tratamento de erro.
4. Atualizar chamadas gradualmente.

### G-08. Erros Postgres expostos ao cliente

Severidade: **P2**.

Evidencia: APIs de acompanhamento/admin retornam `pgError.message` e `pgError.code` em alguns caminhos.

Impacto:

- mensagens internas podem expor detalhes de schema;
- UX de erro fica tecnica;
- risco de enumeracao de constraints.

Acao:

1. Mapear codigos Postgres permitidos para mensagens publicas.
2. Logar detalhes internamente.
3. Retornar mensagens genericas para cliente.

### G-10. Observabilidade operacional incompleta

Severidade: **P2**.

Evidencia:

- `/api/analytics` registra eventos;
- admin analytics consulta `analytics_eventos`;
- nao foi identificado Sentry/Datadog/alertas uptime;
- webhook usa `console.log`/`console.error`.

Acao:

1. Definir provedor de monitoramento.
2. Instrumentar erro em APIs criticas.
3. Persistir eventos financeiros e ETL.
4. Criar alertas para falha de webhook, falha de ETL e erro 500.

### G-12. Debito visual e funcional de UI

Severidade: **P1/P2**, dependendo do item.

Detalhe completo: `docs/PLACEHOLDER_REPORT.md`.

Itens mais relevantes:

| Problema | Evidencia |
|---|---|
| `href="#"` | `CandidatoPageClient.tsx:168`, `CandidatoPageClient.tsx:329` |
| Chat candidato desabilitado | `CandidatoPageClient.tsx:260`, `CandidatoPageClient.tsx:269` |
| Abas painel em breve | `FeedCivico.tsx:108` |
| Dados mock app home | `HomeApp.tsx:22` |
| Heatmap/coesao placeholder | `PartidoDetailClient.tsx:604`, `:644`, `:655` |

## Gaps Resolvidos Nesta Consolidação

| ID anterior/novo | Gap | Status | Evidencia |
|---|---|---|---|
| G-15 | README raiz desatualizado | Resolvido no Lote 1 | `README.md` atualizado com Logto, Next.js 16, Postgres direto e docs |
| G-16 | Falta de `MVP_REAL_IDENTIFICADO.md` e `PRODUCAO_READINESS.md` | Resolvido no Lote 1 | Arquivos criados |
| G-17 | Falta de inventario de rotas/features | Resolvido no Lote 2 | `INVENTORY_ROUTES.md`, `INVENTORY_FEATURES.md` |

## Divergencias De Requisitos

### Stripe vs InfinitePay

Documentos antigos ainda mencionam Stripe e `payment_intent`. O runtime ativo identificado usa InfinitePay:

| Fonte | Estado |
|---|---|
| `docs/API.md` | Ainda contem secao historica de Stripe |
| `docs/TODO_PRODUCTION.md` | Mantem historico Stripe e item InfinitePay |
| Codigo atual | `app/src/app/api/apoio/*`, `webhooks/infinitepay` |

Resolucao: tratar Stripe como historico; foco de producao deve ser InfinitePay.

### Supabase Auth vs Logto

Documentos antigos mencionam Supabase Auth. Codigo atual usa Logto:

| Fonte | Estado |
|---|---|
| `app/src/lib/logto/*` | Ativo |
| `app/src/app/api/auth/logto/*` | Ativo |
| `app/src/lib/auth/profile-linking.ts` | Ainda usa fallback legado em `auth.users` |

Resolucao: Logto e fonte ativa; fallback legado deve ser documentado e ter plano de desligamento.

### Admin ETL: "Rodar agora" vs "Registrar solicitacao"

UI/admin sugere acao operacional de ETL. API apenas registra log e retorna mensagem de SSH manual.

Resolucao: ate haver trigger real, a feature deve ser renomeada ou marcada como solicitacao manual.

## Ordem Recomendada De Correcao

| Ordem | Item | Motivo |
---|---|---|
| 1 | Rotacionar/remover segredo em doc legado | P0 seguranca |
| 2 | Persistir webhook InfinitePay | P0/P1 financeiro |
| 3 | Validar banco/dev e build | P1 go-live tecnico |
| 4 | Corrigir ETL admin ou rebaixar promessa da UI | P1 operacional |
| 5 | Remover agenda/alertas fake do painel | P1 confianca do usuario |
| 6 | Corrigir `href="#"` e botoes sem acao | P1/P2 UX |
| 7 | Centralizar Postgres pool | P2 manutenibilidade |
| 8 | Implementar testes minimos | P1/P2 regressao |

## Handoff Para Lotes Seguintes

Lote 4 deve aprofundar banco e uso real:

- confirmar se `doacoes` existe ou nao no schema;
- mapear tabelas ativas/fantasmas;
- separar tabelas usadas por app, admin, ETL e docs antigas;
- documentar `perfis`, `acompanhamentos`, `politicos`, `votacoes`, `gastos`, `emendas`, `proposicoes`, `analytics_eventos`, `admin_logs`.

Lote 5 deve fechar API/Auth:

- documentar contrato exato de `/api/apoio/criar-link` e `/api/webhooks/infinitepay`;
- documentar rotas Logto;
- documentar lacuna de `auth.users` legado;
- cruzar APIs expostas vs chamadas pelo frontend.
