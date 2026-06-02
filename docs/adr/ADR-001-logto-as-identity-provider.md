# ADR-001: Logto as Identity Provider

## Status

Accepted

## Data

2026-06-01

## Contexto

autenticacao e camada de RLS. O banco foi migrado manualmente via DBeaver para
versionadas.

A infraestrutura Norotec usa Logto como provedor central de identidade em
`https://auth.norotec.cloud`. O projeto alvo e `meuspoliticos.com.br`.

## Problema


- `auth.users` como tabela de usuarios;
- `auth.uid()` e `auth.jwt()` em policies RLS;
- trigger `on_auth_user_created`;
- funcao `public.handle_new_user()`;

Essa arquitetura conflita com o objetivo de usar Logto como identidade central
Norotec e manter PostgreSQL VPS como banco principal.

## Status de execução

- Sprint 1B aplicada via migration de compatibilidade
- Sprint 1F consolidada: `email_normalizado` nao foi adotado
- Reconciliacao temporaria usa `auth.users.email` via join legado

## Alternativas avaliadas


Vantagem: menor alteracao imediata.

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
- `auth.users`, `auth.uid()` e `auth.jwt()` nao serao dependencias do estado
  final.
- PostgreSQL VPS permanecera como banco principal.

## Consequencias

Consequencias positivas:

- identidade centralizada na infraestrutura Norotec;
- modelo de usuario controlado pela aplicacao;
- melhor rastreabilidade da migracao.

Consequencias negativas:

- necessidade de backfill e reconciliacao de usuarios;
- revisao de RLS, policies, triggers e middlewares;
- risco de divergencia se usuarios forem vinculados por email sem controle de
  duplicidade.

## Impacto no banco

Alteracoes esperadas:

- adicionar `perfis.logto_sub`;
- adicionar metadados de migracao;
- migrar relacoes de usuario para `perfis.id`;
- remover FKs futuras para `auth.users`;
- remover trigger `on_auth_user_created`;
- remover `public.handle_new_user()`;
- substituir policies baseadas em `auth.uid()` e `auth.jwt()`.

## Impacto nas aplicacoes

Alteracoes esperadas:

- criar camada de auth neutra: `getCurrentUser()`, `requireUser()`,
  `requireAdmin()`;
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
