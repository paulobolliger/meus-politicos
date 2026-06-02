---
file: docs/MVP_REAL_IDENTIFICADO.md
module: MVP Real Identificado
status: Active
related: [README.md, docs/PRODUCAO_READINESS.md, docs/INVENTORY_ROUTES.md, docs/INVENTORY_FEATURES.md, docs/INVENTORY_API_CONSUMPTION.md, docs/INVENTORY_DATABASE_USAGE.md]
---

# MVP Real Identificado

Data do inventario: 2026-06-02.

Este documento descreve apenas o que foi identificado no codigo atual. Quando a documentacao historica diverge do codigo, o codigo vence e a divergencia deve ser tratada como gap nas proximas consolidacoes.

## Veredito Executivo

O projeto possui um **MVP tecnico identificavel** para transparencia politica com busca, perfil de politico, acompanhamento por usuario autenticado e painel com feed civico baseado em dados reais. O recorte atual e adequado para **Beta controlado**, mas ainda nao para producao plena.

Classificacao: **MVP/Beta tecnico**.

Motivo: o core loop central existe em codigo e cruza frontend, autenticacao, API e banco. Entretanto, ha bloqueios relevantes em pagamentos, seguranca documental, validacao runtime do banco remoto/desenvolvimento e areas importantes de UI ainda em placeholder.

## Core Loop Atual

### Jornada minima que o usuario consegue completar em codigo

1. Usuario acessa o site publico em `/`.
2. A home carrega votacoes recentes via PostgreSQL direto a partir de `votacoes`.
3. Usuario navega para `/busca`.
4. A tela de busca chama `/api/busca`.
5. `/api/busca` consulta `politicos` e `partidos`, aplica filtros e retorna lista paginada.
6. Usuario abre `/politicos/[id]`.
7. A pagina de perfil consulta `politicos`, `partidos`, `votacoes`, `gastos`, `presenca` e `emendas`.
8. Usuario clica em "Acompanhar".
9. O componente cliente chama `POST /api/acompanhamentos`.
10. A API usa `getCurrentUser()` para obter usuario Logto reconciliado com `perfis`.
11. A API grava `usuario_id` e `politico_id` em `acompanhamentos`.
12. Usuario acessa `/painel`.
13. O painel consulta `perfis`, `acompanhamentos`, `politicos`, `partidos`, `votacoes` e `gastos`.
14. O painel renderiza politicos seguidos, KPIs e feed civico de votacoes/gastos recentes.

### Evidencias diretas

| Parte do loop | Arquivo | Evidencia |
|---|---|---|
| Home publica com dados reais | `app/src/app/(site)/page.tsx` | `SELECT ... FROM votacoes WHERE proposicao_id IS NOT NULL` |
| Busca UI | `app/src/app/(site)/busca/page.tsx` e `app/src/components/busca/BuscaClient.tsx` | Tela cliente usa `/api/busca` |
| Busca API | `app/src/app/api/busca/route.ts` | Consulta `politicos p LEFT JOIN partidos pa` |
| Perfil de politico | `app/src/app/(app)/politicos/[id]/page.tsx` | Consulta `politicos`, `partidos`, `votacoes`, `gastos`, `presenca`, `emendas` |
| Botao acompanhar | `app/src/components/politico/BotaoAcompanhar.tsx` | `fetch('/api/acompanhamentos', { method: 'POST' })` e `DELETE /api/acompanhamentos/[politicoId]` |
| API acompanhar | `app/src/app/api/acompanhamentos/route.ts` | `INSERT INTO acompanhamentos (usuario_id, politico_id)` |
| API deixar de acompanhar | `app/src/app/api/acompanhamentos/[politicoId]/route.ts` | `DELETE FROM acompanhamentos WHERE usuario_id = $1 AND politico_id = $2` |
| Usuario atual | `app/src/lib/auth/current-user.ts` | Logto session + perfil interno |
| Reconciliacao de perfil | `app/src/lib/auth/profile-linking.ts` | `perfis.logto_sub`, fallback por email legado em `auth.users` |
| Painel | `app/src/app/(painel)/(dashboard)/painel/page.tsx` | Le `acompanhamentos` e monta feed com `votacoes` e `gastos` |

## MVP Que Funciona Agora

### 1. Site publico de transparencia

Status: **Parcialmente funcional com dados reais**.

O site publico tem rotas para home, busca, politicos, projetos, partidos, estados, Camara, glossario, candidatos 2026 e apoio. A home e varias rotas consultam PostgreSQL diretamente. A busca publica e um dos fluxos mais concretos porque possui endpoint interno, filtros e paginacao.

Funciona em codigo:

| Feature | Status | Dados reais usados |
|---|---|---|
| Home com votacoes recentes | Funcional em codigo | `votacoes` |
| Busca de politicos | Funcional em codigo | `politicos`, `partidos` |
| Perfil de politico | Funcional em codigo | `politicos`, `partidos`, `votacoes`, `gastos`, `presenca`, `emendas` |
| Glossario | Funcional em codigo | `glossario` |
| Projetos/proposicoes | Parcialmente funcional | `proposicoes`, `proposicao_autores`, `proposicao_tramitacoes` |
| Camara | Parcialmente funcional | `politicos`, `partidos`, `gastos`, `votacoes`, `proposicoes` |
| Estados | Parcialmente funcional | `estados_*`, `municipios`, `emendas`, `politicos` |
| Candidatos 2026 | Parcialmente funcional | `candidatos`, tentativa de `candidatos_bens` |

### 2. Acompanhamento de politicos

Status: **Funcional em codigo, dependente de Logto e perfil reconciliado**.

O fluxo de acompanhar/desacompanhar existe e grava em banco. A API exige usuario autenticado e trata violacoes de unicidade e FK. A operacao depende de `currentUser.perfilId`, que so existe se a sessao Logto foi reconciliada com um registro em `perfis`.

Endpoints envolvidos:

| Endpoint | Metodo | Status no MVP |
|---|---|---|
| `/api/acompanhamentos` | `POST` | Cria acompanhamento |
| `/api/acompanhamentos` | `GET` | Lista IDs seguidos, mas o painel atual le direto do banco |
| `/api/acompanhamentos/[politicoId]` | `DELETE` | Remove acompanhamento |

Tabelas envolvidas:

| Tabela | Papel |
|---|---|
| `perfis` | Perfil interno do usuario e role |
| `acompanhamentos` | Relacao usuario-politico |
| `politicos` | Politico acompanhado |

### 3. Painel e feed civico

Status: **Funcional em codigo para usuario autenticado com politicos seguidos**.

O painel usa `getCurrentUser()` e redireciona para `/login` quando nao ha usuario. Depois consulta dados reais:

| Consulta | Finalidade |
|---|---|
| `SELECT nome FROM perfis WHERE id = $1` | Nome do usuario |
| `SELECT politico_id FROM acompanhamentos WHERE usuario_id = $1` | Politicos seguidos |
| `SELECT ... FROM politicos LEFT JOIN partidos` | Cards de seguidos |
| `SELECT ... FROM votacoes WHERE politico_id = ANY(...) AND data >= ...` | Feed de votacoes recentes |
| `SELECT ... FROM gastos WHERE politico_id = ANY(...) AND criado_em >= ...` | Feed de gastos recentes |

O feed civico e real quando ha dados recentes nas tabelas. Caso contrario, ha estado vazio e mensagens de "em breve" em componentes auxiliares.

## Features Essenciais Concluidas

| Feature essencial | Status | Comentario |
|---|---|---|
| Estrutura Next.js App Router | Concluida em codigo | Rotas publicas, app, painel, admin e APIs existem |
| Busca de politicos | Concluida em codigo | API e UI conectadas |
| Perfil de politico | Concluida parcial | Dados reais, mas secoes ainda incompletas em UI |
| Logto como identidade | Concluida em codigo | Rotas Logto e helpers presentes |
| Reconciliacao Logto -> `perfis` | Concluida em codigo | Usa `logto_sub` e fallback por email legado |
| Acompanhar/desacompanhar | Concluida em codigo | APIs gravam/removem em `acompanhamentos` |
| Painel com feed civico | Concluida parcial | Le dados reais, mas estados vazios e alertas/proximas votacoes ainda limitados |
| Admin basico | Parcial | Usuarios, flags, dados, analytics e ETL existem; ETL run e apenas registro |
| ETLs de dados publicos | Parcial | Scripts amplos existem, mas execucao operacional nao foi validada nesta fase |

## Diferenciais Incompletos Ou Nao-MVP

| Diferencial | Status identificado | Evidencia |
|---|---|---|
| Pagamento recorrente/completo | Incompleto | InfinitePay cria link, webhook nao persiste doacao |
| Trigger real de ETL pelo admin | Incompleto | `/api/admin/etl/run` registra log e informa SSH manual em breve |
| Alertas ativos | Incompleto | Painel passa `alertasAtivos={0}` |
| Proximas votacoes | Incompleto | Painel passa `proximaVotacaoLabel={null}` |
| Comissoes no perfil app | Placeholder | Texto "Comissoes - em breve" |
| Deputados estaduais/vereadores por estado | Parcial/placeholder | Mensagens "dados em breve" |
| Chat/perguntas em candidato/projeto | Placeholder | Inputs e textos sem fluxo completo confirmado |
| Mapa interativo | Placeholder | Texto "Mapa interativo - em breve" |
| Bens de candidatos | Parcial | Codigo tenta `candidatos_bens`, mas tambem assume tabela pode nao existir |

## As 3 Acoes Estritamente Impeditivas

### P0-1. Corrigir segredo em documentacao legada e rotacionar credencial

Status: **Impeditivo de producao**.

Foi identificado um valor de `RESEND_API_KEY` aparentemente real em `docs/meuspoliticos_master.md`. O valor nao deve ser reproduzido em relatorios ou logs.

Acao necessaria:

1. Rotacionar a chave no provedor Resend.
2. Remover o segredo do arquivo legado.
3. Fazer varredura historica Git obrigatoria.
4. Registrar incidente e mitigacao em `docs/SECURITY.md`.
5. Se o arquivo for arquivado ou removido, marcar a acao com `[REQUER_CONFIRMAÇÃO_HUMANA]`.

### P0-2. Persistir pagamentos e validar webhook InfinitePay

Status: **Impeditivo de producao se apoio financeiro for fluxo publico ativo**.

O endpoint `/api/apoio/criar-link` cria link real na InfinitePay, mas `/api/webhooks/infinitepay` apenas valida minimamente o payload, extrai `tipo` e registra `console.log`. Ha `TODO` explicito para persistir doacao.

Acao necessaria:

1. Definir/criar tabela `doacoes` ou equivalente no schema.
2. Persistir `order_nsu`, `transaction_nsu`, `invoice_slug`, valor, tipo, status, recibo e timestamps.
3. Garantir idempotencia por `order_nsu`.
4. Validar assinatura/autenticidade do webhook conforme contrato InfinitePay, se disponivel.
5. Criar teste de webhook com payload valido, payload invalido e retry.

### P0-3. Validar runtime de banco/deploy sem risco de producao

Status: **Impeditivo de go-live tecnico**.

O inventario nao executou conexao ativa ao banco porque `app/.env.local` aponta para host remoto/desconhecido. Pela regra P0, a conexao foi abortada. O codigo depende intensamente de Postgres direto, entao producao depende de validacao operacional de conectividade, migrations, RLS/grants e variaveis.

Acao necessaria:

1. Provisionar ambiente local/dev explicitamente seguro ou confirmar tunnel local.
2. Executar pre-flight com timeout de 5 segundos.
3. Validar `SELECT 1`, tabelas centrais, grants e contagem minima de dados.
4. Validar `npm run build` com variaveis de build seguras.
5. Validar fluxo Logto completo em ambiente de preview.

## Limites Do MVP

O MVP nao deve prometer:

- cobertura completa de todos os cargos politicos;
- pagamentos persistidos;
- execucao real de ETL pelo admin;
- alertas civicos completos;
- mapas interativos completos;
- comissoes, historico e todas as abas analiticas finalizadas;
- verificacao automatica de todos os webhooks;
- integridade de todas as tabelas fantasmas/subutilizadas.

## Criterio De Aceite Para Beta Publico

O beta publico pode ser considerado aceitavel quando:

| Criterio | Estado atual | Necessario |
|---|---|---|
| Busca encontra politicos oficiais | Implementado em codigo | Validar runtime |
| Perfil mostra dados principais | Implementado em codigo | Validar dados por cargo |
| Login Logto funciona | Implementado em codigo | Validar callback/sessao em preview |
| Acompanhar grava no banco | Implementado em codigo | Validar end-to-end |
| Painel mostra seguidos/feed | Implementado em codigo | Validar com usuario real |
| Pagamento nao perde evento | Incompleto | Persistir webhook |
| Segredos nao expostos | Incompleto | Rotacionar/remover segredo legado |
| Banco/dev seguro validado | Incompleto | Executar pre-flight permitido |

## Conclusao

O MVP real existe, mas o lancamento deve ser tratado como **Beta com bloqueios P0**. A plataforma ja demonstra valor de produto no loop de busca, perfil, acompanhamento e feed civico. A proxima etapa documental deve mapear com precisao rotas, features, placeholders, APIs consumidas e tabelas usadas para transformar este veredito em plano executavel de producao.

