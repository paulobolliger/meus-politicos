---
file: docs/PROJECT_STATUS_2026-06.md
module: Executive Project Status
status: Active
related: [README.md, CHANGELOG.md, docs/ARCHITECTURE.md, docs/AUTH.md, docs/MODERNIZATION_ROADMAP.md, docs/GAP_ANALYSIS.md, docs/auth/AUTH_MIGRATION_LOGTO.md, docs/adr/ADR-001-logto-as-identity-provider.md]
---

# Status do Projeto - 2026-06

## Estado atual

| Eixo | Status |
|---|---|
| Banco | PostgreSQL VPS ativo |
| Auth | Supabase legado; Logto em preparação |
| Público | Migrado para PostgreSQL direto |
| Painel/Admin | Aguardando Logto |
| Pagamentos | Stripe removido; InfinitePay ativo |

## Arquitetura atual

- Frontend Next.js com rotas públicas já desacopladas do runtime Supabase para leitura
- PostgreSQL VPS como banco principal
- Supabase mantido como legado de identidade e histórico de schema enquanto a transição para Logto é concluída
- InfinitePay como caminho ativo de apoio

## Dependências remanescentes do Supabase

- `auth.users` como referência legada de identidade
- `auth.uid()` e `auth.jwt()` em policies antigas
- `on_auth_user_created`
- `public.handle_new_user()`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `SUPABASE_SERVICE_ROLE_KEY`
- middleware e callbacks de autenticação legados

## Próximas etapas

1. Concluir a ativação de Logto no painel/admin.
2. Consolidar helpers de auth neutros para usuários da aplicação.
3. Reduzir o restante das referências legadas ao Supabase Auth.
4. Validar a documentação e o inventário de env vars já sem Stripe.
5. Fechar a limpeza final do fluxo de identidade legado quando o painel estiver estável.

## Riscos

- Regressão de sessão no painel durante a troca de provedor
- Reconciliacão incorreta de perfis por email duplicado
- Divergência entre documentação histórica e estado ativo
- Dependências legadas do Supabase ainda presentes em policies e helpers
- Drift entre runtime ativo e docs de integração

## Backlog priorizado

| Prioridade | Item |
|---|---|
| P0 | Ativar Logto no fluxo de autenticação do painel/admin |
| P0 | Fechar a limpeza das referências de auth legada no runtime |
| P1 | Consolidar a documentação de estado atual em todas as camadas |
| P1 | Verificar e remover dependências documentais residuais de Stripe |
| P2 | Revisar backlog histórico para separar item concluído de item ainda aberto |

