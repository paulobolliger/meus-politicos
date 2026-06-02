---
file: docs/DEPLOYMENT.md
module: Deployment & Infrastructure
status: Active
related: [docs/ENVIRONMENT.md, docs/ARCHITECTURE.md, docs/MONOREPO.md, vercel.json]
---

# Deploy e Infraestrutura — Meus Políticos

> porque descreve o estado legado. A meta aprovada e Logto
> (`https://auth.norotec.cloud`) + PostgreSQL VPS. Ver
> `docs/auth/AUTH_MIGRATION_LOGTO.md` e
> `docs/adr/ADR-001-logto-as-identity-provider.md`.

---

## 1. Topologia de produção

```
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare (DNS + CDN)                │
│   meuspoliticos.com.br + app.* + painel.*               │
│   meuspoliticos.com (redirect → .com.br)                │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌──────────┴──────────┐
         │                     │
  ┌──────▼──────┐    ┌─────────▼─────────────────┐
  │   Vercel    │    │    VPS Vultr (45.32.169.173)│
  │   (Next.js) │    │    Coolify + Docker         │
  └──────┬──────┘    │    │   (Auth + DB + MinIO)  │
         │           │    ├── PostgreSQL 15         │
         └───────────┤    └── MinIO (S3 storage)   │
         client      └──────────────────────────────┘
```

---

## 2. Frontend — Vercel

### Configuração (`vercel.json`)

```json
{
  "installCommand": "cd app && npm ci --include=optional && npm i --no-save [libs linux tailwind oxide]",
  "buildCommand": "cd app && npm run build",
  "outputDirectory": "app/.next",
  "framework": "nextjs"
}
```

### Por que o `installCommand` instala libs opcionais manualmente

O Tailwind CSS v4 usa binários nativos via `@tailwindcss/oxide`. Em ambiente Linux (Vercel), os pacotes `linux-x64-gnu` e `linux-x64-musl` precisam ser instalados explicitamente pois não são resolvidos automaticamente em `npm ci`:

```bash
npm ci --include=optional
npm i --no-save \
  @tailwindcss/oxide-linux-x64-gnu \
  @tailwindcss/oxide-linux-x64-musl \
  lightningcss-linux-x64-gnu \
  lightningcss-linux-x64-musl
```

Esses pacotes estão em `app/package.json` como `optionalDependencies` para garantir que não quebrem o install em Windows/macOS (onde os binários corretos são baixados automaticamente).

### Variáveis de ambiente na Vercel

Todas as variáveis de `app/.env.local` devem ser configuradas no Vercel Dashboard → Project Settings → Environment Variables. As variáveis `NEXT_PUBLIC_*` são automaticamente injetadas no bundle do cliente.


### Deploy automático

- **Branch `main`:** deploy de produção automático
- **Branch de feature:** preview deploy automático
- Framework detectado automaticamente como Next.js

---

## 3. Banco de dados — VPS Vultr + Coolify

### Infraestrutura

| Componente | Tecnologia | Detalhe |
|---|---|---|
| VPS | Vultr | `45.32.169.173` |
| Orquestrador | Coolify | Self-hosted PaaS — gerencia Docker Compose |
| Storage | MinIO | S3-compatible — logos, fotos, uploads |

### Conexão direta ao banco (ETL e manutenção)

```bash
# SSH tunnel — mapeia banco remoto para localhost:5433
ssh -L 5433:10.0.2.2:5432 root@45.32.169.173 -N -o ServerAliveInterval=30

# Manter em background durante sessão de ETL
# Banco disponível em: localhost:5433 / db: meuspoliticos_db
```

**Nome do container Docker (para uso interno no VPS):**
```
```

### Aplicar migrations

```bash

```


---

## 4. ETL — execução em produção

### Status atual

**⚠️ Gap G-04:** Nenhum GitHub Actions existe. Todo ETL é executado manualmente.

### Execução manual (via SSH tunnel ativo)

```bash
# 1. Ativar SSH tunnel (ver seção 3)
# 2. Instalar dependências Python
pip install -r requirements.txt

# 3. Rodar script específico
cd etl/camara
python collect_deputados.py

cd etl/senado
python collect_senadores.py

cd etl/portal_transparencia
python collect_emendas.py
```

### Scripts com pendências ativas

| Script | Motivo | Gap |
|---|---|---|
| `etl/camara/collect_camara_gastos.py --ano 2026` | Gastos 2026 ausentes | G-07 |
| `etl/senado/collect_senadores.py` | Re-rodar para `mandato_inicio` | G-08 |
| `etl/portal_transparencia/populate_siafi.py` | Re-rodar após novos senadores | G-09 |

### Workflows GitHub Actions recomendados (a implementar — Gap G-04)

| Workflow | Scripts | Frequência sugerida |
|---|---|---|
| `collect-camara.yml` | `collect_deputados.py`, `collect_votacoes.py`, `collect_proposicoes.py` | Diário 6h |
| `collect-senado.yml` | `collect_senadores.py`, `collect_senado_votacoes.py`, `collect_senado_gastos.py` | Diário 6h |
| `collect-emendas.yml` | `collect_emendas.py`, `populate_siafi.py` | Diário 7h |
| `collect-ale.yml` | Scripts `etl/ale/` | Semanal |

---

## 5. DNS e CDN — Cloudflare

| Registro | Tipo | Destino |
|---|---|---|
| `meuspoliticos.com.br` | CNAME | Vercel |
| `app.meuspoliticos.com.br` | CNAME | Vercel |
| `painel.meuspoliticos.com.br` | CNAME | Vercel |
| `meuspoliticos.com` | REDIRECT | `meuspoliticos.com.br` |

**SPF/DKIM:** configurado no Cloudflare para domínio `meuspoliticos.com.br` (Resend).

---

## 6. Scripts disponíveis

### Raiz do monorepo

| Comando | Equivalente real | Descrição |
|---|---|---|
| `npm run dev` | `npm --prefix app run dev` | Servidor de desenvolvimento (Next.js) |
| `npm run build` | `npm --prefix app run build` | Build de produção |
| `npm run start` | `npm --prefix app run start` | Servidor de produção local |
| `npm run lint` | `npm --prefix app run lint` (ESLint) | Verificação de lint |

### Diretamente em `app/`

```bash
cd app
npm run dev      # Next.js dev server (com Turbopack)
npm run build    # Build de produção
npm run start    # Servir build de produção
npm run lint     # ESLint
```

---

## 7. Turbopack (desenvolvimento local)

`app/next.config.ts` configura Turbopack com `root` apontando para o diretório pai do monorepo:

```typescript
turbopack: {
  root: path.resolve(__dirname, '..'),  // raiz do monorepo, não app/
}
```

Isso permite que o Turbopack resolva imports relativos ao monorepo corretamente durante `next dev`.

---

## 8. Python ETL — dependências

`requirements.txt` na raiz do repositório:

```
requests==2.31.0
psycopg[binary]
python-dotenv==1.0.0
python-dateutil==2.8.2
unidecode==1.3.8
```


---

## 9. Checklist de deploy

### Novo ambiente / onboarding

- [ ] Configurar todas as 30+ variáveis em `.env.local` (ver `docs/ENVIRONMENT.md`)
- [ ] Adicionar ao arquivo `hosts`: `127.0.0.1 app.localhost` e `127.0.0.1 painel.localhost`
- [ ] Configurar SSH tunnel para acesso ao banco
- [ ] Instalar dependências: `npm install` (raiz) + `pip install -r requirements.txt`

### Nova migration

- [ ] Commitar a migration no git

### Promoção de feature para produção

- [ ] PR aprovado e mergeado em `main`
- [ ] Vercel detecta push e faz deploy automático
- [ ] Verificar preview deploy antes do merge se a feature for arriscada
- [ ] Habilitar feature flag em `/admin/flags` se aplicável

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
