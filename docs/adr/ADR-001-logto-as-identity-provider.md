# ADR-001: Logto as Identity Provider

## Status

Accepted

## Data

2026-06-01

## Contexto

O projeto Meus Politicos nasceu usando Supabase self-hosted como banco,
autenticacao e camada de RLS. O banco foi migrado manualmente via DBeaver para
PostgreSQL em VPS, sem Supabase CLI e sem reconciliacao completa com migrations
versionadas.

A infraestrutura Norotec usa Logto como provedor central de identidade em
`https://auth.norotec.cloud`. O projeto alvo e `meuspoliticos.com.br`.

## Problema

O codigo e o banco ainda dependem de Supabase Auth:

- `auth.users` como tabela de usuarios;
- `auth.uid()` e `auth.jwt()` em policies RLS;
- trigger `on_auth_user_created`;
- funcao `public.handle_new_user()`;
- clientes `@supabase/ssr` e `@supabase/supabase-js` para sessao;
- middleware Supabase em `app/src/proxy.ts`;
- `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS em rotas admin.

Essa arquitetura conflita com o objetivo de usar Logto como identidade central
Norotec e manter PostgreSQL VPS como banco principal.

## Status de execução

- Sprint 1B aplicada via migration de compatibilidade
- Sprint 1F consolidada: `email_normalizado` nao foi adotado
- Reconciliacao temporaria usa `auth.users.email` via join legado

## Alternativas avaliadas

### Manter Supabase Auth

Vantagem: menor alteracao imediata.

Desvantagem: mantem dependencia de runtime Supabase Auth, `auth.users`,
`auth.uid()` e `auth.jwt()`, duplicando identidade em relacao a infraestrutura
Norotec.

### Migrar integralmente para Logto em uma unica etapa

Vantagem: remove a dependencia rapidamente.

Desvantagem: risco alto de quebrar login, painel, acompanhamentos, analytics,
admin e policies em producao.

### Migrar para Logto em fases com compatibilidade temporaria

Vantagem: preserva usuarios atuais, permite rollback e torna a migracao
auditavel.

Desvantagem: exige periodo temporario com dois modelos de identidade.

## Decisao

Adotar Logto como provedor de identidade principal do projeto Meus Politicos,
com migracao faseada.

Decisoes especificas:

- `public.perfis.id` sera mantido como UUID interno da aplicacao.
- `public.perfis.logto_sub` sera a identidade externa principal.
- `public.perfis.supabase_user_id` sera mantido temporariamente como legado.
- Supabase Auth sera removido como runtime obrigatorio apos migracao.
- `auth.users`, `auth.uid()` e `auth.jwt()` nao serao dependencias do estado
  final.
- PostgreSQL VPS permanecera como banco principal.
- Supabase migrations permanecerao como referencia historica ate limpeza final.

## Consequencias

Consequencias positivas:

- identidade centralizada na infraestrutura Norotec;
- reducao de acoplamento com Supabase Auth;
- modelo de usuario controlado pela aplicacao;
- melhor rastreabilidade da migracao.

Consequencias negativas:

- necessidade de backfill e reconciliacao de usuarios;
- periodo temporario com Supabase Auth e Logto coexistindo;
- revisao de RLS, policies, triggers e middlewares;
- risco de divergencia se usuarios forem vinculados por email sem controle de
  duplicidade.

## Impacto no banco

Alteracoes esperadas:

- adicionar `perfis.logto_sub`;
- adicionar `perfis.supabase_user_id`;
- adicionar metadados de migracao;
- migrar relacoes de usuario para `perfis.id`;
- remover FKs futuras para `auth.users`;
- remover trigger `on_auth_user_created`;
- remover `public.handle_new_user()`;
- substituir policies baseadas em `auth.uid()` e `auth.jwt()`.

## Impacto nas aplicacoes

Alteracoes esperadas:

- substituir login/cadastro/logout Supabase por Logto/OIDC;
- substituir callback Supabase por callback Logto;
- substituir middleware Supabase por middleware Logto;
- criar camada de auth neutra: `getCurrentUser()`, `requireUser()`,
  `requireAdmin()`;
- substituir `user.id` Supabase por `perfilId`;
- substituir `createAdminClient()` Supabase em rotas que passarem a usar
  PostgreSQL direto server-side.

## Impacto na infraestrutura Norotec

Alteracoes esperadas:

- criar/configurar aplicacao Logto para `meuspoliticos.com.br`;
- configurar redirect URIs;
- definir politicas de sessao e logout;
- garantir claims OIDC necessarias;
- documentar secrets Logto no gerenciador de segredos;
- alinhar dominios e cookies com `meuspoliticos.com.br`,
  `app.meuspoliticos.com.br` e `painel.meuspoliticos.com.br`.
