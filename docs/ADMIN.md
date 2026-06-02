---
file: docs/ADMIN.md
module: Admin Panel Reference
status: Active
related: [docs/AUTH.md, docs/DATABASE.md, docs/API.md, docs/MONITORING.md]
---

# Painel Administrativo — Referência

> `createAdminClient()` e service role descrevem o estado atual/legado. O
> roadmap aprovado migra admin/auth para Logto + PostgreSQL VPS. Ver
> `docs/auth/AUTH_MIGRATION_LOGTO.md` e
> `docs/adr/ADR-001-logto-as-identity-provider.md`.

O painel `/admin` é acessível apenas por usuários com `perfis.role = 'admin'`. Reside no route group `(admin)/` e compartilha o host `meuspoliticos.com.br` (site público), diferenciado apenas pelo path `/admin`.

---

## 1. Acesso e proteção

**URL produção:** `https://meuspoliticos.com.br/admin`

**URL dev:** `http://localhost:3000/admin`

**Proteção em dupla camada:**

```
1. Layout server-side: AdminLayout verifica auth.getUser() → redireciona para / se sem sessão
2. Role check: adminClient.from('perfis').select('role').eq('id', user.id)
              → redireciona para / se role !== 'admin'
```

**Como promover usuário a admin:**

```sql
UPDATE perfis SET role = 'admin' WHERE id = '<user_uuid>';
```

Não há interface pública para isso — apenas o responsável do projeto com acesso ao banco ou ao `createAdminClient()`.

---

## 2. Rotas do painel

| Rota | Arquivo | Descrição |
|---|---|---|
| `/admin` | `(admin)/admin/page.tsx` | Dashboard com KPIs e status de ETLs |
| `/admin/analytics` | `(admin)/admin/analytics/page.tsx` | Analytics de uso da plataforma |
| `/admin/dados` | `(admin)/admin/dados/page.tsx` | Correções pendentes + edição de políticos |
| `/admin/etl` | `(admin)/admin/etl/page.tsx` | Status detalhado + disparo manual de ETL |
| `/admin/flags` | `(admin)/admin/flags/page.tsx` | Gerenciamento de feature flags |
| `/admin/usuarios` | `(admin)/admin/usuarios/page.tsx` | Listagem e gestão de usuários |

---

## 3. Dashboard (`/admin`)

**Dados exibidos em tempo real:**

### KPIs de usuários

| Métrica | Fonte |
|---|---|
| Total de usuários cadastrados | `COUNT(*) FROM perfis` |
| Novos usuários nos últimos 7 dias | `COUNT(*) FROM perfis WHERE criado_em >= now() - 7 days` |

### KPIs de banco de dados

| Label | Tabela |
|---|---|
| Políticos | `COUNT(*) FROM politicos` |
| Emendas | `COUNT(*) FROM emendas` |
| Gastos | `COUNT(*) FROM gastos` |
| Votações | `COUNT(*) FROM votacoes` |
| Proposições | `COUNT(*) FROM proposicoes` |
| Municípios | `COUNT(*) FROM municipios` |

### Status dos ETLs

Lista das últimas execuções por `fonte` (agrupado por fonte — exibe apenas a mais recente de cada). Dados de `coletas_log`.

**Alerta automático:** se qualquer ETL falhou nas últimas 24h, um banner vermelho é exibido no topo com o nome das fontes afetadas e link para `/admin/etl`.

**Variantes de status:**

| Status na tabela | Badge |
|---|---|
| `'ok'` / `'sucesso'` | Verde |
| `'parcial'` / `'aviso'` | Âmbar |
| `'erro'` / `'falha'` | Vermelho + link "Ver ETL →" |

---

## 4. ETL (`/admin/etl`)

Exibe o histórico detalhado de coletas e permite solicitar disparo manual.

**Disparo manual:** chama `POST /api/admin/etl/run` com `{ fonte }`. O endpoint **não dispara ETL real** — registra a solicitação em `admin_logs` e instrui execução manual via SSH. Funcionalidade parcial (Gap implícito — ETL automático via GitHub Actions não existe, Gap G-04).

---

## 5. Feature Flags (`/admin/flags`)

Gerencia os flags que controlam features sem necessidade de novo deploy.

**Atualização:** `PATCH /api/admin/flags` com `{ slug, ativo, rollout_pct }`.

Cada alteração é registrada em `admin_logs`.

**Flags disponíveis:** ver `docs/BUSINESS_DOMAIN.md §10` para lista completa com defaults.

---

## 6. Dados (`/admin/dados`)

### Correções de dados públicos

Fluxo: usuário reporta dado incorreto via `/correcao` no site público → `INSERT em correcoes` (público sem auth) → Admin revisa e aprova/rejeita aqui.

**Estados do fluxo:** `pendente` → `aprovado` | `rejeitado` | `arquivado`

### Edição de políticos

Campos editáveis pelo admin via `PATCH /api/admin/politicos/[id]`:

| Campo | Uso |
|---|---|
| `foto_url` | Corrigir URL de foto |
| `nome_eleitoral` | Corrigir nome na urna |
| `codigo_siafi` | Linkar com emendas do Portal da Transparência |
| `email` | Atualizar e-mail de gabinete |

Toda edição é auditada em `admin_logs`.

### Match manual de emendas

`POST /api/admin/emendas/match` — associa emendas ao político correto quando o match automático por `codigo_siafi` não encontrou o registro.

---

## 7. Analytics (`/admin/analytics`)

Visualização dos eventos registrados em `analytics_eventos` via `POST /api/analytics` (rota pública, best-effort).

**Sem PII:** nenhum IP ou e-mail é armazenado — apenas `tipo`, `payload` anônimo e `usuario_id` quando autenticado.

**Tipos de eventos rastreados:** `busca`, `perfil_view`, `emenda_view`, `glossario_view`, `comparar`.

---

## 8. Usuários (`/admin/usuarios`)

Listagem de usuários cadastrados (`perfis`) com dados de criação. Permite visualizar atividade e, implicitamente, promover usuários a admin (edição manual via banco).

---

## 9. Auditoria — `admin_logs`

Toda ação administrativa fica registrada:

```sql
-- Estrutura do registro
{
  usuario_id: uuid,     -- quem fez
  acao: text,           -- 'editar_politico' | 'atualizar_feature_flag' | 'etl_rodar_agora'
  entidade: text,       -- 'politicos' | 'feature_flags' | 'coletas_log'
  entidade_id: text,    -- ID do registro afetado
  detalhe: jsonb,       -- campos alterados ou payload da ação
  criado_em: timestamptz
}
```

RLS: acessível apenas por admin (`EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')`).

---

## 10. Acesso a dados no admin

O painel usa `createAdminClient()` (service role) para consultas que precisam:

- Ler tabelas sem RLS estrito (ex: `admin_logs`, `feature_flags`)
- Contar registros de tabelas com types TypeScript desatualizados
- Verificar `perfis.role` sem passar pela política RLS do próprio usuário

As páginas do admin são **Server Components** — os dados são buscados diretamente no servidor, sem expor o service role key ao cliente.

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
