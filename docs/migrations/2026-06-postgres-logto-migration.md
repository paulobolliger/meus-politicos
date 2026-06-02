---
file: docs/migrations/2026-06-postgres-logto-migration.md
module: PostgreSQL + Logto Migration Chronicle
status: Active
---

# Migração PostgreSQL + Logto + Remoção do Stripe

Documento cronológico oficial das últimas sprints da modernização de identidade, banco e pagamentos.

## Fonte oficial hoje

- [docs/auth/AUTH_MIGRATION_LOGTO.md](../auth/AUTH_MIGRATION_LOGTO.md): trilha operacional da migração de identidade
- [docs/adr/ADR-001-logto-as-identity-provider.md](../adr/ADR-001-logto-as-identity-provider.md): decisão arquitetural aprovada
- [docs/PROJECT_STATUS_2026-06.md](../PROJECT_STATUS_2026-06.md): panorama executivo do estado atual
- [CHANGELOG.md](../../CHANGELOG.md): registro formal por sprint

---

## 1. Auditoria Documental

### 1. O que já está documentado

- O roadmap de identidade Logto em [docs/auth/AUTH_MIGRATION_LOGTO.md](../auth/AUTH_MIGRATION_LOGTO.md)
- A decisão arquitetural de migrar a identidade para Logto em [docs/adr/ADR-001-logto-as-identity-provider.md](../adr/ADR-001-logto-as-identity-provider.md)
- O estado legado de autenticação em [docs/AUTH.md](../AUTH.md)
- O backlog de gaps e a trilha de modernização em [docs/GAP_ANALYSIS.md](../GAP_ANALYSIS.md) e [docs/MODERNIZATION_ROADMAP.md](../MODERNIZATION_ROADMAP.md)
- O schema histórico e a base de migrations em [docs/DATABASE.md](../DATABASE.md)

### 2. O que não estava documentado

- A cronologia consolidada das sprints 0R, 1B, 1F, 1G, 1H-A, 1H-B e 1I-A
- O estado executivo atual da plataforma após a adoção de PostgreSQL direto no público
- A retirada do Stripe da superfície pública de pagamentos
- A documentação formal da migration de compatibilidade `20260601000000_logto_identity_compat.sql`

### 3. O que estava parcialmente documentado

- A reconciliação de usuários por `auth.users.email`
- O uso de PostgreSQL VPS como banco principal
- O fluxo de apoio via InfinitePay
- A transição de autenticação do painel/admin para Logto

### 4. Fontes oficiais da migração hoje

1. [docs/auth/AUTH_MIGRATION_LOGTO.md](../auth/AUTH_MIGRATION_LOGTO.md)
2. [docs/adr/ADR-001-logto-as-identity-provider.md](../adr/ADR-001-logto-as-identity-provider.md)
4. [docs/PROJECT_STATUS_2026-06.md](../PROJECT_STATUS_2026-06.md)
5. [CHANGELOG.md](../../CHANGELOG.md)

---

## 2. Sprint 0R - Auditoria Banco Real

- **Descoberta do banco correto:** `meuspoliticos_db`
- **Banco legado comparado no relatório arquivado:** `meus_politicos_db`
- **Usuário auditado:** `noro_master`
- **Volume total auditado:** `587.63 MB`
- **Schemas encontrados:** `public`, `auth`, `storage`, `realtime`, `graphql_public`
- **Top tabelas observadas na auditoria e no schema atual:** `gastos`, `votacoes`, `proposicoes`, `emendas`, `politicos`, `feed_eventos`, `coletas_log`, `raw_senado`

---

## 3. Sprint 1B - Compatibilidade Logto

- Colunas adicionadas em `public.perfis`:
  - `logto_sub`
  - `migrado_logto_em`
- Índices únicos parciais criados:
  - `perfis_logto_sub_uidx`

---

## 4. Sprint 1F - Ajustes de Compatibilidade

- Estratégia de `email_normalizado` abandonada
- A reconciliação passou a usar `auth.users.email` via join com `public.perfis.id = auth.users.id`
- O email não foi tratado como coluna nova em `public.perfis`
- A decisão preservou compatibilidade com usuários legados sem alterar a identidade interna do perfil

---

## 5. Sprint 1G - Aplicação da Migration

- Backup executado antes da aplicação
- Migration aplicada no banco PostgreSQL VPS
- Índices de compatibilidade criados e validados
- Validações documentadas:
  - coluna `logto_sub` presente
  - índice único parcial por `logto_sub`
  - preservação do relacionamento legado com `auth.users`

---

## 6. Sprint 1H-A - Migração das Rotas Públicas

- Home migrada para PostgreSQL direto
- Busca migrada para PostgreSQL direto
- `estado/[sigla]` migrada para PostgreSQL direto
- A camada pública passou a depender do banco PostgreSQL VPS como fonte principal de leitura

---

## 7. Sprint 1H-B - Migração de `politicos/[id]`

- `auth.getUser` removido do fluxo dessa página
- Acompanhamentos foram removidos do caminho dessa rota
- `politicos/[id]` passou a consultar PostgreSQL direto

---

## 8. Sprint 1I-A - Migração Pública Final

- `proposicoes` migrado para PostgreSQL direto
- `comparar` migrado para PostgreSQL direto
- `cidades` migrado para PostgreSQL direto
- `glossario` migrado para PostgreSQL direto
- O site público consolidou a adoção de PostgreSQL como leitura principal

---

## 9. Stripe Removal

- Stripe removido da superfície ativa da aplicação
- Dependências removidas do `app/package.json`
- Variáveis `STRIPE_*` removidas do `.env.example`
- Rota de criação de intent Stripe removida
- Webhook Stripe removido
- O fluxo ativo de pagamentos permaneceu com InfinitePay
- `POST /api/apoio/criar-link` foi preservado para InfinitePay
- `/apoio/confirmacao` permaneceu como tela de confirmação sem Stripe

---

## 10. Leitura executiva


