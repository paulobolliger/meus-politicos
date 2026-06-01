# Migracao de Auth: Supabase Auth para Logto

## Status atual

Status: planejamento aprovado, implementacao nao iniciada.

Este documento consolida os diagnosticos feitos ate agora sobre a migracao de
autenticacao do projeto Meus Politicos.

Restricoes atuais:

- Nao executar migrations sem aprovacao humana.
- Nao executar seeds.
- Nao executar `npm run dev` ou `npm run build` durante auditorias.
- Nao executar `supabase db *`.
- Nao conectar ao banco de producao sem aprovacao explicita.
- Tratar as migrations Supabase existentes como referencia historica de schema,
  nao como garantia do estado real do banco VPS.

Contexto confirmado:

- O banco Supabase self-hosted foi migrado manualmente via DBeaver para um
  PostgreSQL em VPS.
- A migracao nao foi feita via Supabase CLI nem por migrations versionadas.
- A autenticacao alvo da infraestrutura Norotec e Logto.
- Endpoint central Logto: `https://auth.norotec.cloud`.
- Projeto alvo: `meuspoliticos.com.br`.
- O codigo e o schema ainda possuem dependencias de Supabase Auth.

## Referencias de governanca

- ADR: `docs/adr/ADR-001-logto-as-identity-provider.md`
- Documento operacional: `docs/auth/AUTH_MIGRATION_LOGTO.md`
- Roadmap executivo: `docs/MODERNIZATION_ROADMAP.md`

## Arquitetura atual

### Banco

O banco principal e PostgreSQL, historicamente modelado como Supabase
self-hosted. O schema publico da aplicacao esta representado em
`supabase/migrations/` e no arquivo legado `supabase/001_schema.sql`.

Dependencias atuais de Supabase Auth no banco:

- `public.perfis.id` referencia `auth.users(id)`.
- `public.acompanhamentos.usuario_id` referencia `auth.users(id)`.
- Policies RLS usam `auth.uid()`.
- Policies administrativas antigas usam `auth.jwt()`.
- Existe trigger em `auth.users`: `on_auth_user_created`.
- Existe funcao `public.handle_new_user()`.
- Grants usam roles Supabase: `anon`, `authenticated`, `service_role`.

Objetos sensiveis:

- `public.perfis`
- `public.acompanhamentos`
- policies de `perfis`, `acompanhamentos`, admin, logs e IA
- views que usam `acompanhamentos.usuario_id`
- logs/analytics/admin que gravam `usuario_id`

### Aplicacao

O app Next.js usa duas formas de acesso ao banco:

- Supabase client/Auth/PostgREST por `@supabase/ssr` e
  `@supabase/supabase-js`.
- PostgreSQL direto por `pg` em paginas, API routes e componentes server-side.

Pontos atuais de Supabase Auth:

- `app/src/lib/supabase/client.ts`
- `app/src/lib/supabase/server.ts`
- `app/src/lib/supabase/middleware.ts`
- `app/src/proxy.ts`
- componentes de login, cadastro, recuperacao de senha e logout
- callback em `app/src/app/(auth)/auth/callback/route.ts`
- chamadas `supabase.auth.getUser()` em painel, admin, analytics,
  acompanhamentos e paginas de politico
- uso de `SUPABASE_SERVICE_ROLE_KEY` em `createAdminClient()`

## Dependencias Supabase identificadas

Dependencias de runtime e schema que devem ser removidas ate o estado final:

- `auth.users` como tabela de identidade.
- `auth.uid()` em policies RLS.
- `auth.jwt()` em policies RLS/admin.
- Trigger `on_auth_user_created`.
- Funcao `public.handle_new_user()`.
- `@supabase/ssr` para sessao SSR.
- `@supabase/supabase-js` para Auth no browser/server.
- Middleware Supabase em `app/src/proxy.ts`.
- Callback Supabase em `app/src/app/(auth)/auth/callback/route.ts`.
- `SUPABASE_SERVICE_ROLE_KEY` como mecanismo de bypass administrativo.

## Arquitetura alvo

### Identidade

Logto passa a ser o provedor OIDC principal.

Modelo alvo recomendado:

- `public.perfis.id`: UUID interno da aplicacao.
- `public.perfis.logto_sub`: identificador externo principal vindo do Logto.
- `public.perfis.supabase_user_id`: identificador legado para auditoria e
  reconciliacao.
- `public.perfis.role`: autorizacao de aplicacao.

O `sub` do Logto deve ser a identidade externa definitiva. Email pode ser usado
para reconciliacao inicial, mas nao deve ser a chave primaria de identidade. A
auditoria real do PostgreSQL VPS confirmou que `public.perfis` nao possui coluna
de email; enquanto `auth.users` existir como legado, a reconciliacao inicial por
email deve usar `auth.users.email` via join `public.perfis.id = auth.users.id`.

### Autorizacao

Autorizacao deve migrar para a camada server-side da aplicacao:

- `getCurrentUser()`
- `requireUser()`
- `requireAdmin()`

Esses helpers devem retornar um usuario de aplicacao, nao um usuario de
provider:

```ts
{
  perfilId: string
  logtoSub: string
  email: string | null
  name: string | null
  role: 'user' | 'admin'
}
```

RLS baseada em `auth.uid()` e `auth.jwt()` deve ser removida no final da
migracao. Se RLS continuar sendo usada, ela deve depender de funcoes proprias da
aplicacao, nao do schema `auth` do Supabase.

### Runtime

Supabase deixa de ser runtime obrigatorio de autenticacao.

O runtime alvo e:

- Logto para login, logout, cadastro, recuperacao de acesso e sessao.
- PostgreSQL VPS como banco principal.
- Next.js server-side como fronteira de autorizacao.
- Supabase mantido apenas como referencia historica de schema/migrations ate a
  limpeza final.

### Dependencias Logto

Dependencias de infraestrutura alvo:

- Issuer OIDC: `https://auth.norotec.cloud`.
- Aplicacao Logto para `meuspoliticos.com.br`.
- Redirect URI de callback para o dominio do painel/site definido na fase de
  implementacao.
- Session/cookie server-side gerenciado pela integracao Logto no Next.js.
- Claims OIDC minimas: `sub`, `email`, `name` quando disponiveis.
- Vinculo persistente em `public.perfis.logto_sub`.

## Decisoes aprovadas

- Migrar Supabase Auth para Logto.
- Usar `https://auth.norotec.cloud` como autoridade OIDC.
- Manter PostgreSQL na VPS como banco principal.
- Nao depender de `auth.users` no estado final.
- Nao depender de `auth.uid()` nem `auth.jwt()` no estado final.
- Introduzir `logto_sub` em `public.perfis`.
- Manter temporariamente identidade Supabase legada para compatibilidade.
- Preservar acompanhamentos, analytics e painel durante a transicao.
- Nao remover Supabase Auth no primeiro sprint.
- Primeiro adicionar compatibilidade Logto sem quebrar usuarios atuais.

## Riscos

### Banco migrado manualmente

Como o banco foi migrado via DBeaver, o estado real pode divergir das migrations.
Riscos principais:

- migrations locais nao representam o banco real;
- FKs, triggers, functions e policies ausentes;
- owners e grants diferentes;
- roles Supabase ausentes ou inconsistentes;
- schemas `auth`, `storage` e `realtime` incompletos;
- extensions ausentes, especialmente suporte a `gen_random_uuid()`;
- sequences ou identity columns desalinhadas em objetos fora do schema publico;
- objetos aplicados manualmente sem rastreabilidade.

### Migracao de identidade

Riscos principais:

- usuario Logto nao casar com perfil legado;
- emails duplicados impedirem vinculacao automatica;
- usuarios sem email exigirem revisao manual;
- troca precipitada de `perfis.id` quebrar acompanhamentos e painel;
- remocao antecipada de FKs para `auth.users` quebrar login Supabase atual;
- policies antigas bloquearem operacoes durante a transicao.

### Codigo

Riscos principais:

- chamadas diretas a `supabase.auth.getUser()` ficarem para tras;
- `createAdminClient()` continuar mascarando problemas de permissao;
- rotas admin divergirem das regras de `perfis.role`;
- partes publicas que usam Postgres direto abrirem conexao para ambiente errado;
- middleware Logto bloquear rotas publicas por erro de configuracao.

## Plano em fases

### Fase 0: auditoria e mapeamento

Objetivo: confirmar o estado real antes de qualquer alteracao destrutiva.

Tarefas:

- Inventariar usos de Supabase Auth no codigo.
- Inventariar dependencias de `auth.users`, `auth.uid()` e `auth.jwt()` no SQL.
- Auditar `public.perfis`, `public.acompanhamentos`, analytics e logs.
- Validar se o banco VPS possui objetos esperados: views, triggers, functions,
  policies, grants, extensions e schemas Supabase.
- Gerar mapa de usuarios atuais.

Saida esperada:

- lista de divergencias banco real x migrations;
- lista de usuarios reconciliaveis por email;
- lista de casos ambiguos.

### Fase 1: compatibilidade Logto sem remover Supabase

Objetivo: preparar o banco e o codigo para Logto, mantendo Supabase Auth
funcionando.

Migrations previstas:

- adicionar `perfis.logto_sub`;
- adicionar `perfis.supabase_user_id`;
- adicionar `perfis.auth_provider`;
- adicionar `perfis.migrado_logto_em`;
- criar indices parciais para `logto_sub` e `supabase_user_id`;
- preencher `supabase_user_id = id` para perfis existentes.

Observacao do banco real: `public.perfis` nao tem email. A lista de usuarios
reconciliaveis por email deve ser extraida temporariamente de `auth.users.email`
por join legado com `public.perfis.id = auth.users.id`.

Codigo previsto:

- criar camada neutra de auth;
- criar tipos de usuario atual;
- manter implementacao inicial delegando para Supabase;
- documentar variaveis Logto;
- nao trocar login/cadastro/logout ainda.

Nao fazer nesta fase:

- remover FKs para `auth.users`;
- remover policies Supabase;
- remover trigger `on_auth_user_created`;
- remover `@supabase/ssr`;
- remover `SUPABASE_SERVICE_ROLE_KEY`.

### Fase 2: migrar login, cadastro, callback e middleware

Objetivo: colocar Logto no fluxo de autenticacao.

Tarefas:

- configurar app Logto para `meuspoliticos.com.br`;
- criar callback Logto;
- substituir login/cadastro por redirecionamento OIDC;
- substituir logout por logout Logto;
- substituir recuperacao de senha por fluxo Logto;
- substituir middleware Supabase por middleware Logto;
- usar `getCurrentUser()` nas rotas privadas;
- vincular perfil no primeiro login.

Regra de vinculacao:

1. buscar `perfis.logto_sub = claims.sub`;
2. se nao existir, buscar match unico por `auth.users.email` via join legado
   `public.perfis.id = auth.users.id`;
3. se houver match unico, preencher `logto_sub`;
4. se houver duplicidade, bloquear e registrar caso para revisao;
5. se nao houver perfil, criar novo perfil.

### Fase 3: migrar dominio e autorizacao

Objetivo: parar de usar `user.id` Supabase como identidade de dominio.

Tarefas:

- trocar usos de `user.id` por `currentUser.perfilId`;
- migrar `acompanhamentos.usuario_id` para uma FK em `perfis.id`;
- atualizar views que contam seguidores;
- atualizar analytics e logs para gravar `perfil_id` e opcionalmente
  `logto_sub`;
- trocar checks admin para `currentUser.role`;
- reduzir uso de `createAdminClient()`.

### Fase 4: remover Supabase Auth

Objetivo: eliminar dependencia funcional do schema `auth`.

Tarefas:

- remover FKs para `auth.users`;
- remover trigger em `auth.users`;
- remover `public.handle_new_user()`;
- remover policies com `auth.uid()`;
- remover policies com `auth.jwt()`;
- remover grants e roles Supabase se nao forem mais usados pelo runtime;
- tornar `perfis.logto_sub` obrigatorio para usuarios ativos;
- remover helpers Supabase Auth do codigo.

### Fase 5: limpeza final

Objetivo: consolidar arquitetura final.

Tarefas:

- remover dependencias npm Supabase se nao houver mais uso runtime;
- remover `app/src/lib/supabase/*` quando obsoleto;
- atualizar tipos de banco;
- consolidar acesso PostgreSQL em um modulo unico;
- atualizar documentacao;
- manter `supabase/migrations/` como historico, nao como mecanismo runtime.

## Rollback

### Antes da Fase 2

Rollback simples:

- manter Supabase Auth como fluxo ativo;
- ignorar colunas Logto adicionadas;
- nao remover dados de compatibilidade.

### Durante Fase 2

Rollback por feature flag:

- `AUTH_PROVIDER=supabase` volta fluxo antigo;
- middleware Supabase volta a proteger rotas;
- login/cadastro/logout Supabase permanecem disponiveis ate estabilizacao.

### Depois da Fase 3

Rollback exige cuidado:

- manter colunas legadas durante pelo menos uma release;
- preservar `supabase_user_id`;
- preservar `usuario_id` legado ate todas as views e rotas estarem migradas;
- nao remover policies Supabase antes de validacao completa.

### Depois da Fase 4

Rollback e alto risco:

- requer backup ou migration reversa;
- recriar FKs para `auth.users`;
- recriar trigger `on_auth_user_created`;
- recriar `handle_new_user()`;
- recriar policies `auth.uid()` e `auth.jwt()`;
- reativar Supabase Auth no codigo.

## Checklist de testes

### Banco

- `perfis.logto_sub` existe.
- `perfis.supabase_user_id` existe.
- Indice unique parcial de `logto_sub` existe.
- Indice unique parcial de `supabase_user_id` existe.
- `perfis.id` continua preservado.
- `acompanhamentos` preserva todos os registros.
- Nenhuma FK para `auth.users` e removida antes da fase correta.
- Nenhuma policy Supabase e removida antes da fase correta.
- Trigger `on_auth_user_created` continua ativa ate a remocao planejada.

### Autenticacao

- Dados legados de usuario Supabase continuam preservados na Fase 1.
- Login usuario existente via Logto funciona na Fase 2.
- Usuario novo via Logto cria perfil.
- Usuario existente e vinculado por email unico.
- Usuario com email duplicado nao e vinculado automaticamente.
- Logout encerra sessao correta.
- Sessao expirada redireciona para login.

### Autorizacao

- Usuario comum nao acessa admin.
- Admin acessa admin.
- Role em `perfis.role` e respeitada.
- APIs admin bloqueiam usuario comum.
- APIs privadas bloqueiam anonimo.

### Funcionalidades preservadas

- Painel carrega para usuario autenticado.
- Lista de acompanhamentos e preservada.
- Acompanhar politico funciona.
- Desacompanhar politico funciona.
- Analytics registra usuario autenticado.
- Analytics registra anonimo quando aplicavel.
- Logs admin preservam autoria.

### Regressao publica

- Home.
- Busca.
- Politicos.
- Projetos.
- Glossario.
- Estado.
- Camara.
- Partidos.
- Paginas de assembleia.

## Sprint 1: compatibilidade Logto

Objetivo: introduzir compatibilidade Logto sem quebrar usuarios atuais.

Arquivos previstos:

- `supabase/migrations/YYYYMMDDHHMMSS_logto_identity_compat.sql`
- `.env.example`
- `docs/ENVIRONMENT.md`
- `docs/auth/AUTH_MIGRATION_LOGTO.md`
- `app/src/lib/auth/types.ts`
- `app/src/lib/auth/current-user.ts`
- `app/src/lib/auth/profile-linking.ts`
- `app/src/lib/auth/providers.ts`
- possivel modulo central de Postgres server-side

Validacao de aceite:

- usuarios legados Supabase continuam rastreaveis por `supabase_user_id`;
- banco aceita armazenar `logto_sub`;
- perfil legado permanece rastreavel por `supabase_user_id`;
- nenhuma dependencia Supabase Auth e removida ainda;
- documentacao e variaveis Logto ficam preparadas para o Sprint 2.

## Sprint 2: ativacao Logto controlada

Objetivo: colocar Logto em fluxo real de autenticacao atras de feature flag.
Como o runtime Supabase Auth foi apagado, ele nao deve ser considerado caminho
de retorno; o rollback realista e voltar ao estado de banco anterior por
snapshot/backup e desativar o fluxo Logto no codigo.

Escopo previsto:

- configurar aplicacao Logto para `meuspoliticos.com.br`;
- criar callback Logto;
- implementar login/logout Logto;
- vincular perfil por `logto_sub` ou por email legado de `auth.users.email`
  enquanto o schema `auth` ainda existir;
- preservar dados legados Supabase para reconciliacao e auditoria;
- registrar casos ambiguos para revisao manual.

Validacao de aceite:

- usuario legado consegue entrar via Logto e preservar painel;
- usuario novo cria perfil;
- usuario com email duplicado nao e vinculado automaticamente;
- rollback operacional depende de snapshot/backup do PostgreSQL e reversao do
  codigo Logto; Supabase Auth nao deve ser tratado como fallback runtime.

## Sprint 3: dominio e autorizacao

Objetivo: mover o dominio da aplicacao para identidade interna `perfis.id` com
`logto_sub` como identidade externa.

Escopo previsto:

- substituir usos de `user.id` do Supabase por `currentUser.perfilId`;
- migrar `acompanhamentos.usuario_id` para relacao com `perfis.id`;
- atualizar painel, analytics, logs e admin para usar `perfilId`;
- reduzir dependencia de `createAdminClient()`;
- preparar remocao de RLS baseada em Supabase Auth.

Validacao de aceite:

- acompanhamentos historicos preservados;
- painel e admin usam identidade de aplicacao;
- analytics continua vinculando eventos ao usuario correto.

## Sprint 4: remocao Supabase Auth

Objetivo: remover a dependencia funcional de Supabase Auth.

Escopo previsto:

- remover FKs para `auth.users`;
- remover trigger `on_auth_user_created`;
- remover funcao `public.handle_new_user()`;
- remover policies com `auth.uid()`;
- remover policies com `auth.jwt()`;
- remover helpers Supabase Auth e variaveis obrigatorias de auth Supabase;
- manter migrations Supabase apenas como historico de schema.

Validacao de aceite:

- nenhuma rota de auth depende de Supabase;
- nenhuma policy ativa depende de `auth.uid()` ou `auth.jwt()`;
- banco principal opera com Logto + PostgreSQL VPS.
