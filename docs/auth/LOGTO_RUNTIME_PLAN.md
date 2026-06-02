---
file: docs/auth/LOGTO_RUNTIME_PLAN.md
module: Sprint 2B - Logto Runtime Implementation Plan
status: Active
related: [docs/auth/LOGTO_IMPLEMENTATION_PLAN.md, docs/auth/AUTH_MIGRATION_LOGTO.md, docs/adr/ADR-001-logto-as-identity-provider.md, app/src/lib/auth/current-user.ts, app/src/lib/auth/profile-linking.ts, app/src/lib/auth/providers.ts, app/src/proxy.ts]
---

# Sprint 2B - Plano de Implementação Logto Runtime

Objetivo: definir o plano técnico antes da implementação do runtime Logto.

Escopo:

- não altera código;
- não altera banco;
- não cria migrations;
- não implementa nada;
- apenas consolida a arquitetura alvo e a ordem segura de execução.

## Base documental usada

- [Sprint 2A - Inventário Completo de Auth](LOGTO_IMPLEMENTATION_PLAN.md)
- [Migração de Auth: Supabase Auth para Logto](AUTH_MIGRATION_LOGTO.md)
- [ADR-001: Logto as Identity Provider](../adr/ADR-001-logto-as-identity-provider.md)

## 1. SDK Logto recomendado

O SDK recomendado para este projeto Next.js App Router é `@logto/next`.

Motivos:

- é o SDK oficial documentado pela Logto para Next.js App Router;
- fornece `getLogtoContext`, `signIn`, `signOut`, `handleSignIn`, `getAccessToken` e `getAccessTokenRSC`;
- a documentação oficial usa `app/logto.ts` como configuração central;
- o fluxo é baseado em OIDC com redirect-based sign-in, compatível com a estrutura já existente do app.

Referências oficiais:

- https://docs.logto.io/quick-starts/next-app-router
- https://docs.logto.io/end-user-flows/sign-out
- https://docs.logto.io/end-user-flows/sign-up-and-sign-in/reset-password

## 2. Variáveis de ambiente necessárias

### Novas variáveis Logto

- `LOGTO_ENDPOINT`
- `LOGTO_APP_ID`
- `LOGTO_APP_SECRET`
- `LOGTO_COOKIE_SECRET`
- `AUTH_PROVIDER=logto`

### Variáveis de ambiente já existentes que continuam necessárias durante a transição

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_PAINEL_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

### Observações de configuração

- `LOGTO_COOKIE_SECRET` precisa ter no mínimo 32 caracteres.
- `LOGTO_ENDPOINT` deve apontar para o issuer Logto da infraestrutura Norotec.
- `AUTH_PROVIDER=logto` serve como chave de corte para o runtime novo, preservando rollback simples.

## 3. Rotas e callbacks necessários

### Rotas que devem permanecer como entrada pública

- `/login`
- `/cadastro`
- `/recuperar-senha`
- `/logout` ou ação equivalente de sign-out

### Callback obrigatório

- `GET /auth/callback`

Esse callback substitui o `exchangeCodeForSession` do Supabase por `handleSignIn(logtoConfig, searchParams)`.

### Rotas opcionais, dependendo da escolha de UX

- `/auth/sign-in`
- `/auth/sign-out`
- `/auth/reset-password`

Essas rotas só são necessárias se a equipe preferir encapsular ações de servidor em handlers dedicados.
No modelo App Router com `@logto/next`, o caminho mais simples é usar server actions para `signIn` e `signOut` e manter apenas o callback como rota de backend.

### Recuperação de senha

Há duas opções válidas:

1. usar o fluxo nativo de reset de senha do Logto, acionado a partir da tela de login;
2. criar um endpoint auto-hospedado que inicia o fluxo com `first_screen=reset-password`.

O plano recomendado aqui é a opção 1, porque reduz superfície de manutenção e acompanha a documentação oficial do Logto.

## 4. Arquivos que serão criados

### Núcleo Logto

- `app/src/lib/logto/config.ts`
- `app/src/lib/logto/session.ts`
- `app/src/lib/logto/user.ts`

### Rotas auxiliares, se a equipe optar por encapsular ações

- `app/src/app/(auth)/auth/sign-in/route.ts`
- `app/src/app/(auth)/auth/sign-out/route.ts`
- `app/src/app/(auth)/auth/reset-password/route.ts`

### Documentação

- `docs/auth/LOGTO_RUNTIME_PLAN.md`

## 5. Arquivos que serão alterados

### Fluxos de auth

- `app/src/components/auth/LoginForm.tsx`
- `app/src/components/auth/CadastroForm.tsx`
- `app/src/components/auth/RecuperarSenhaForm.tsx`
- `app/src/components/meus-politicos/BotaoSair.tsx`
- `app/src/app/(auth)/auth/callback/route.ts`
- `app/src/app/(painel)/(auth)/login/page.tsx`
- `app/src/app/(painel)/(auth)/cadastro/page.tsx`
- `app/src/app/(painel)/(auth)/recuperar-senha/page.tsx`

### Autorização e sessão

- `app/src/lib/auth/current-user.ts`
- `app/src/lib/auth/profile-linking.ts`
- `app/src/lib/auth/providers.ts`
- `app/src/proxy.ts`
- `app/src/lib/supabase/middleware.ts`

### Superfícies que dependem de usuário

- `app/src/app/(painel)/(dashboard)/painel/page.tsx`
- `app/src/app/(painel)/(dashboard)/meus-politicos/page.tsx`
- `app/src/app/(admin)/admin/layout.tsx`
- `app/src/app/(admin)/admin/page.tsx`
- `app/src/app/(admin)/admin/analytics/page.tsx`
- `app/src/app/(admin)/admin/usuarios/page.tsx`
- `app/src/app/(admin)/admin/flags/page.tsx`
- `app/src/app/(admin)/admin/etl/page.tsx`
- `app/src/app/(admin)/admin/dados/page.tsx`
- `app/src/app/api/analytics/route.ts`
- `app/src/app/api/acompanhamentos/route.ts`
- `app/src/app/api/acompanhamentos/[politicoId]/route.ts`
- `app/src/components/politico/BotaoAcompanhar.tsx`

## 6. Ordem segura de implementação

### Fase 1 - Infra e configuração

1. Criar a configuração central `app/src/lib/logto/config.ts`.
2. Registrar variáveis de ambiente Logto.
3. Criar a app tradicional no Logto Console.
4. Configurar redirect URIs e post-logout redirect URIs.
5. Manter Supabase Auth em paralelo até a validação do login Logto.

### Fase 2 - Sessão e callback

1. Substituir o callback Supabase por `handleSignIn(logtoConfig, searchParams)`.
2. Validar persistência de sessão em subdomínios.
3. Garantir que `getLogtoContext(logtoConfig)` funcione em Server Components e route handlers.

### Fase 3 - Login, cadastro e logout

1. Trocar login e cadastro por `signIn(logtoConfig)`.
2. Redirecionar o fluxo de recuperação de senha para o mecanismo nativo do Logto.
3. Trocar logout por `signOut(logtoConfig)`.
4. Preservar o painel funcional durante o período de convivência.

### Fase 4 - Identidade de aplicação

1. Reescrever `getCurrentUser()` para consumir Logto primeiro.
2. Vincular perfil via `logto_sub`.
3. Manter fallback de reconciliação por e-mail legado.
4. Parametrizar `requireUser()` e `requireAdmin()` sobre o novo usuário de aplicação.

### Fase 5 - Superfícies dependentes de usuário

1. Atualizar painel.
2. Atualizar admin.
3. Atualizar acompanhamentos.
4. Atualizar analytics dependentes de usuário.
5. Só depois remover o runtime Supabase Auth dos pontos que sobrarem.

## 7. Como vincular `Logto user` -> `public.perfis`

### Identificador principal

O identificador externo principal passa a ser `claims.sub` do Logto.

### Regra de vínculo

1. buscar `public.perfis.logto_sub = claims.sub`;
2. se existir, usar esse perfil;
3. se não existir e houver `email`, procurar reconciliação legada;
4. se houver correspondência única, preencher `logto_sub` no perfil encontrado;
5. se houver múltiplos perfis ou ambiguidade, bloquear o vínculo automático e registrar revisão manual;
6. se não houver perfil, criar novo `perfis` no fluxo de implementação da fase 2.

### Campos de apoio

- `perfis.id` continua sendo o UUID interno da aplicação;
- `perfis.supabase_user_id` preserva o vínculo legado;
- `perfis.auth_provider` indica `supabase` ou `logto`;
- `perfis.migrado_logto_em` marca a primeira vinculação/migração.

## 8. Como usar `auth.users.email` como legado de reconciliação

O documento operacional já confirma que o banco legado não tem uma coluna de e-mail em `public.perfis` para esta reconciliação. Portanto:

1. a busca inicial continua sendo por `logto_sub`;
2. se não houver match, usa-se a relação legada `public.perfis.id = auth.users.id`;
3. a correspondência é feita por `auth.users.email`;
4. isso vale apenas como ponte de migração;
5. a reconciliação por e-mail precisa ser tratada como heurística controlada, nunca como identidade final.

Regra prática:

- e-mail único: pode ser vinculado automaticamente;
- e-mail duplicado: não vincular automaticamente;
- e-mail ausente: exigir criação nova ou revisão manual.

## 9. Como substituir os fluxos atuais

### Login

- sair de `supabase.auth.signInWithOAuth` e `supabase.auth.signInWithPassword`;
- entrar em `signIn(logtoConfig)` ou fluxo Logto equivalente;
- manter `/login` como página de entrada.

### Cadastro

- sair de `supabase.auth.signUp`;
- entrar no fluxo de sign-up do Logto;
- manter `/cadastro` como página de entrada ou redirecionar para a mesma experiência de login do Logto com sign-up habilitado.

### Recuperação de senha

- sair de `supabase.auth.resetPasswordForEmail`;
- usar o fluxo nativo de reset de senha do Logto;
- se necessário, ativar `first_screen=reset-password` em um endpoint próprio;
- manter `/recuperar-senha` como entrada da UI.

### Logout

- sair de `supabase.auth.signOut`;
- entrar em `signOut(logtoConfig)`;
- configurar redirect pós-logout para `/` ou `/login`, conforme UX do painel.

### Middleware

- sair de `updateSession(request)` baseado em `@supabase/ssr`;
- entrar em uma estratégia Logto para leitura de sessão e claims;
- preservar a lógica de roteamento por host, trocando apenas o provedor de sessão.

### `getCurrentUser`

- manter a assinatura da função, se possível;
- ler `getLogtoContext(logtoConfig)` primeiro;
- resolver `perfis` por `logto_sub`;
- usar `auth.users.email` apenas como fallback legado enquanto a migração ainda precisar dele;
- retornar um `CurrentUser` de aplicação, não um usuário de provider.

## 10. Riscos

### Riscos de identidade

- `sub` do Logto não casar com o perfil esperado;
- usuários com e-mail duplicado gerarem vínculo ambíguo;
- usuários antigos perderem acesso ao painel durante a primeira rodada da migração;
- o fluxo de recuperação de senha ficar inconsistente com o UX atual.

### Riscos de sessão

- cookie de sessão não persistir corretamente entre subdomínios;
- logout global do Logto não limpar o estado local da app;
- redirecionamentos pós-login não respeitarem o `redirectTo`.

### Riscos de superfície

- admin continuar dependendo da API administrativa do Supabase por tempo demais;
- painel ainda usar `user.id` do Supabase enquanto a identidade já mudou;
- acompanhamentos e analytics ficarem presos ao `usuario_id` legado.

### Riscos operacionais

- configuração de `LOGTO_COOKIE_SECRET` inválida;
- URIs de redirect divergirem do domínio real;
- política de e-mail/reset não estar habilitada no Console Logto;
- falta de estratégia clara para usuários sem e-mail válido.

## 11. Plano de rollback

Rollback deve ser simples no começo e progressivamente mais caro.

### Antes de trocar o callback

- manter `AUTH_PROVIDER=supabase`;
- não alterar as rotas existentes;
- reverter apenas a configuração Logto no Console, se necessário.

### Depois de trocar login/logout

- manter Supabase Auth disponível em paralelo por um ciclo de validação;
- preservar os helpers e rotas legadas até a estabilização;
- desativar Logto via flag de ambiente se surgirem problemas.

### Depois de vincular perfis

- preservar `supabase_user_id` e `auth_provider`;
- não remover `auth.users` do modelo operacional ainda;
- manter a heurística de reconciliação auditável;
- se necessário, reverter a marcação `auth_provider='logto'` para os registros afetados.

### Rollback duro

Se a transição falhar depois da adoção completa:

- restaurar snapshot/backup do estado anterior da app;
- reativar o runtime Supabase Auth;
- manter a documentação da migração para rastreabilidade;
- não remover os artefatos históricos já documentados.

## 12. Checklist de testes

### Login

- login com e-mail/senha abre o fluxo Logto;
- login social continua funcionando se o provedor estiver habilitado;
- `redirectTo` pós-login é respeitado;
- sessão persiste após reload.

### Cadastro

- novo usuário consegue se registrar;
- usuário criado recebe vínculo correto em `perfis`;
- o app redireciona corretamente para a próxima tela.

### Recuperação de senha

- tela de recuperação dispara o fluxo Logto;
- e-mail de recuperação é enviado;
- reset conclui com sucesso;
- usuário consegue entrar com a nova senha.

### Logout

- logout encerra sessão local;
- logout encerra sessão central Logto;
- redirecionamento pós-sign-out funciona.

### Middleware e rotas

- `/login`, `/cadastro`, `/recuperar-senha` continuam acessíveis;
- `painel.*` bloqueia usuário não autenticado;
- `app.*` redireciona corretamente;
- `meuspoliticos.com.br` mantém o comportamento esperado em produção.

### Painel e admin

- painel carrega com usuário Logto;
- admin reconhece `role='admin'`;
- lista de usuários continua navegável;
- analytics e acompanhamentos continuam vinculados ao usuário correto.

### Reconciliação

- `logto_sub` é preenchido para usuários existentes;
- `auth.users.email` funciona apenas como fallback legado;
- e-mails duplicados não são vinculados automaticamente.

