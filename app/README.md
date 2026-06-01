---
file: app/README.md
module: App — Technical Reference
status: Active
related: [README.md, docs/ARCHITECTURE.md, docs/ENVIRONMENT.md, app/CLAUDE.md]
---

# app/ — Next.js 16 Application

Diretório raiz do frontend do Meus Políticos. Para visão geral do projeto, ver o [README principal](../README.md).

## Desenvolvimento local

```bash
# Na raiz do monorepo:
npm run dev    # inicia Next.js em localhost:3000

# Direto neste diretório:
cd app && npm run dev
```

Requer `app/.env.local` configurado. Ver [docs/ENVIRONMENT.md](../docs/ENVIRONMENT.md).

## Subdomínios locais

Adicione ao arquivo `hosts` do sistema:

```
127.0.0.1 app.localhost
127.0.0.1 painel.localhost
```

| URL | Produto |
|---|---|
| `localhost:3000` | Site público |
| `app.localhost:3000` | App analítico |
| `painel.localhost:3000` | Painel do usuário autenticado |

## Estrutura interna

```
src/
├── app/
│   ├── (site)/      # meuspoliticos.com.br — site público
│   ├── (app)/       # app.meuspoliticos.com.br — app analítico
│   ├── (painel)/    # painel.meuspoliticos.com.br — usuário autenticado
│   │   ├── (auth)/       # login, cadastro, recuperar-senha
│   │   └── (dashboard)/  # /painel, /meus-politicos
│   ├── (admin)/     # /admin — painel interno (role: admin)
│   ├── (checkout)/  # fluxo de doação/pagamento
│   ├── (auth)/      # callback OAuth
│   └── api/         # route handlers: webhooks, busca, acompanhamentos
├── components/
│   ├── civic/       # Biblioteca cívica reutilizável — consultar ANTES de criar novo componente
│   ├── site/        # Componentes exclusivos do site público
│   ├── politico-v2/ # Perfil do político (app analítico)
│   ├── ui/          # shadcn/ui base
│   └── ...          # outros grupos por feature
├── lib/
│   └── supabase/    # client.ts · server.ts · middleware.ts · types.ts
├── types/           # TypeScript types globais
└── proxy.ts         # Middleware de roteamento por host (subdomínios)
```

## Regras críticas

- **Antes de criar componente:** verificar `src/components/civic/` primeiro
- **Antes de exibir score ou métrica:** ler [`docs/METRICS.md`](../docs/METRICS.md)
- **Antes de exibir campo de perfil:** ler [`docs/BACKOFFICE_DATA_CONTRACT.md`](../docs/BACKOFFICE_DATA_CONTRACT.md)
- **Tokens CSS:** `src/app/globals.css` — seção `:root`
- **Dados indisponíveis:** exibir `"–"` com tooltip `"Dados sendo coletados"`
- **Antes de rodar ETL:** consultar banco para verificar dados já existentes (ver `app/CLAUDE.md`)

Para instruções completas de agentes IA: ver [CLAUDE.md](CLAUDE.md) e [AGENTS.md](AGENTS.md).
