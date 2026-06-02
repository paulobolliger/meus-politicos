---
file: docs/DESIGN.md
module: Visual Governance
status: Active
related: [docs/INVENTORY_ROUTES.md, docs/PLACEHOLDER_REPORT.md, docs/INVENTORY_FEATURES.md, app/src/app/globals.css, app/src/components/ui]
---

# Design

Este documento define a governanca visual e registra o status real de migracao visual das telas mapeadas. A base tecnica usa CSS variables em `app/src/app/globals.css`, componentes locais em `app/src/components/ui`, icones `lucide-react`, Tailwind CSS 4 e varios blocos com inline styles legados.

## 1. Principios de Governanca Visual

| Principio | Regra operacional |
|---|---|
| Clareza civica | Interfaces devem priorizar leitura, comparacao e rastreabilidade de dados politicos |
| Densidade controlada | Admin, painel e app analitico devem ser compactos e escaneaveis, sem composicao promocional |
| Honestidade de estado | Areas incompletas devem declarar status real sem simular dados produtivos |
| Acessibilidade minima | Botao/links/foco/contraste precisam ser verificaveis antes de producao |
| Tokenizacao | Cores, bordas, fundos e tipografia devem preferir variaveis globais |
| Iconografia consistente | `lucide-react` e a biblioteca padrao para icones funcionais |
| Componentes reutilizaveis | Novos controles devem usar `app/src/components/ui` ou componentes civicos existentes |

## 2. Base Visual Atual

### 2.1 Tokens Globais

Arquivo: `app/src/app/globals.css`.

| Categoria | Tokens identificados | Uso |
|---|---|---|
| Fundo | `--bg`, `--bg-2`, `--panel`, `--panel-2`, `--surface` | Layouts, paineis, cards |
| Linhas | `--line`, `--line-soft`, `--line-strong` | Bordas e divisores |
| Texto | `--ink`, `--ink-2`, `--ink-3`, `--mute` | Hierarquia tipografica |
| Marca | `--brand`, `--brand-2`, `--brand-soft` | Acoes primarias, links, destaques |
| Acentos | `--accent`, `--accent-soft`, `--accent-gold`, `--accent-gold-soft` | Sinais secundarios |
| Semantica | `--pos`, `--neg`, `--warn`, `--info` e variantes soft | Status, presenca, alertas |
| Radius | `--radius-*` | Componentes shadcn/Base UI |
| Tema escuro | `.theme-dark` redefine tokens | App/painel/auth em modo escuro |

### 2.2 Bibliotecas Visuais

| Biblioteca | Versao | Papel | Status |
|---|---:|---|---|
| `tailwindcss` | `^4` | Utility CSS e tokens via `@theme` | Ativa |
| `shadcn` | `^4.7.0` | CLI/ecossistema de componentes | Ativa como base importada |
| `@base-ui/react` | `^1.4.1` | Primitivos acessiveis nos componentes UI | Ativa |
| `lucide-react` | `^1.14.0` | Iconografia funcional | Ativa ampla |
| `framer-motion` | `^12.38.0` | Animacoes em cards/IA | Uso pontual |
| `react-simple-maps` | `^3.0.0` | Mapa do Brasil | Ativa em componentes civicos |
| `recharts` | `^3.8.1` | Graficos | Dependencia instalada; uso direto nao confirmado na varredura rapida |
| `tw-animate-css` | `^1.4.0` | Animacoes CSS | Importada em `globals.css` |
| `tailwind-merge`/`clsx` | `^3.6.0`/`^2.1.1` | Composicao de classes via `cn()` | Ativas |

### 2.3 Componentes UI Locais

Diretorio: `app/src/components/ui`.

| Componente | Status | Observacao |
|---|---|---|
| `button.tsx` | Ativo | Base UI + CVA |
| `badge.tsx` | Ativo | Base UI/useRender + CVA |
| `tabs.tsx` | Ativo | Base UI Tabs |
| `dialog.tsx` | Ativo | Base UI Dialog |
| `sheet.tsx` | Ativo | Base UI Dialog como sheet |
| `input.tsx` | Ativo | Base UI Input |
| `avatar.tsx` | Ativo | Base UI Avatar |
| `separator.tsx` | Ativo | Base UI Separator |
| `skeleton.tsx` | Ativo | Loading placeholder |

## 3. Status de Migracao Visual por Superficie

Legenda:

| Status | Definicao |
|---|---|
| `Migrado` | Usa tokens/componentes e entrega visual consistente |
| `Parcial` | Tela usavel, mas mistura inline styles, mock visual ou padroes divergentes |
| `Pendente` | Tela incompleta, placeholder ou estado "em breve" relevante |
| `Critico` | Visual sugere funcao produtiva sem suporte operacional suficiente |

## 4. Matriz Pagina por Pagina

### 4.1 Site Publico

| Rota | Arquivo | Status visual | Observacoes |
|---|---|---|---|
| `/` | `app/src/app/(site)/page.tsx` | Parcial | Home civica funcional, mas depende de mix server data + componentes locais |
| `/busca` | `app/src/app/(site)/busca/page.tsx` | Migrado parcial | Usa fluxo de busca real via componente client |
| `/sobre` | `app/src/app/(site)/sobre/page.tsx` | Parcial | Visual institucional com `lucide-react` |
| `/como-funciona` | `app/src/app/(site)/como-funciona/page.tsx` | Parcial | Conteudo explicativo |
| `/manifesto` | `app/src/app/(site)/manifesto/page.tsx` | Parcial | Visual editorial/institucional |
| `/fontes` | `app/src/app/(site)/fontes/page.tsx` | Parcial | Iconografia lucide; precisa garantir rastreabilidade |
| `/metodologia` | `app/src/app/(site)/metodologia/page.tsx` | Parcial | Conteudo metodologico |
| `/termos` | `app/src/app/(site)/termos/page.tsx` | Parcial | Client state para scroll/ancoras |
| `/privacidade` | `app/src/app/(site)/privacidade/page.tsx` | Parcial | Client state para scroll/ancoras |
| `/apoio` | `app/src/app/(site)/apoio/page.tsx` | Critico | UI cria checkout, mas confirmacao financeira ainda nao fecha no webhook |
| `/confirmacao` | `app/src/app/(site)/confirmacao/page.tsx` | Parcial | Confirmacao generica |
| `/estado` | `app/src/app/(site)/estado/page.tsx` | Parcial | Estilo proprio com grid/regioes |
| `/estado/[sigla]` | `app/src/app/(site)/estado/[sigla]/page.tsx` | Parcial | Dados reais, UI estadual customizada |
| `/estado/[sigla]/assembleia` | `app/src/app/(site)/estado/[sigla]/assembleia/page.tsx` | Parcial | Cobertura ALE depende de dados |
| `/estado/[sigla]/assembleia/[slug]` | `app/src/app/(site)/estado/[sigla]/assembleia/[slug]/page.tsx` | Parcial | Detalhe estadual |
| `/meu-estado` | `app/src/app/(site)/meu-estado/page.tsx` | Parcial | UX depende de CEP/localidade |
| `/cidades` | `app/src/app/(site)/cidades/page.tsx` | Pendente parcial | Contem indicacao operacional de ETL IBGE |
| `/camara` | `app/src/app/(site)/camara/page.tsx` + `CamaraClient.tsx` | Parcial | Forte uso de inline styles e cores hardcoded |
| `/partidos` | `app/src/app/(site)/partidos/page.tsx` | Parcial | UI rica com filtros/tabs |
| `/partidos/[sigla]` | `app/src/app/(site)/partidos/[sigla]/page.tsx` | Parcial | Detalhe partidario |
| `/projetos` | `app/src/app/(site)/projetos/page.tsx` | Parcial | Busca/listagem |
| `/projetos/[slug]` | `app/src/app/(site)/projetos/[slug]/page.tsx` | Parcial | Detalhe |
| `/glossario` | `app/src/app/(site)/glossario/page.tsx` | Parcial | Conteudo utilitario |
| `/glossario/[slug]` | `app/src/app/(site)/glossario/[slug]/page.tsx` | Parcial | Detalhe termo |
| `/candidatos-2026` | `app/src/app/(site)/candidatos-2026/page.tsx` | Pendente/Critico | Catalogado como incompleto em lotes anteriores |
| `/candidatos-2026/[slug]` | `app/src/app/(site)/candidatos-2026/[slug]/page.tsx` | Pendente parcial | Dados/fluxo eleitoral ainda dependem de ETL |
| `/manutencao` | `app/src/app/(site)/manutencao/page.tsx` | Migrado parcial | Estado sistemico |
| `/indisponivel` | `app/src/app/(site)/indisponivel/page.tsx` | Migrado parcial | Estado sistemico |
| `/erro` | `app/src/app/(site)/erro/page.tsx` | Migrado parcial | Estado sistemico |
| `/acesso-negado` | `app/src/app/(site)/acesso-negado/page.tsx` | Migrado parcial | Estado de autorizacao |

### 4.2 App Analitico

| Rota | Arquivo | Status visual | Observacoes |
|---|---|---|---|
| `/home` | `app/src/app/(app)/home/page.tsx`, `HomeApp.tsx` | Parcial | Interface rica, muito inline style |
| `/app-busca` | `app/src/app/(app)/app-busca/page.tsx` | Migrado parcial | Busca real |
| `/politicos/[id]` | `app/src/app/(app)/politicos/[id]/page.tsx`, `PerfilApp.tsx` | Parcial | Perfil V2 forte; tabs/modo local |
| `/comparar` | `app/src/app/(app)/comparar/page.tsx`, `CompararClient.tsx` | Parcial | Busca comparativa real, params divergentes (`limite`) |
| `/proposicoes` | `app/src/app/(app)/proposicoes/page.tsx` | Parcial | Server-side com filtros |
| `/proposicoes/[slug]` | `app/src/app/(app)/proposicoes/[slug]/page.tsx` | Parcial | Detalhe com resumo simplificado |

### 4.3 Painel

| Rota | Arquivo | Status visual | Observacoes |
|---|---|---|---|
| `/login` | `app/src/app/(painel)/(auth)/login/page.tsx`, `LoginForm.tsx` | Parcial | Visual consistente, mas formularios redirecionam para Logto |
| `/cadastro` | `app/src/app/(painel)/(auth)/cadastro/page.tsx`, `CadastroForm.tsx` | Parcial | OAuth visual, Logto real |
| `/recuperar-senha` | `app/src/app/(painel)/(auth)/recuperar-senha/page.tsx` | Parcial | Reset Logto |
| `/recuperar-senha/confirmar` | `app/src/app/(painel)/(auth)/recuperar-senha/confirmar/page.tsx` | Parcial | Confirmacao |
| `/painel` | `app/src/app/(painel)/(dashboard)/painel/page.tsx` | Parcial/Critico | Core painel existe; `FeedCivico` ainda nao e pipeline real |
| `/meus-politicos` | `app/src/app/(painel)/(dashboard)/meus-politicos/page.tsx` | Parcial | Acompanhamentos |

### 4.4 Admin

| Rota | Arquivo | Status visual | Observacoes |
|---|---|---|---|
| `/admin` | `app/src/app/(admin)/admin/page.tsx` | Parcial | Dashboard operacional |
| `/admin/usuarios` | `app/src/app/(admin)/admin/usuarios/page.tsx` | Parcial | Usuarios/Logto legado |
| `/admin/flags` | `app/src/app/(admin)/admin/flags/page.tsx` | Parcial | Mutacao via API |
| `/admin/etl` | `app/src/app/(admin)/admin/etl/page.tsx` | Critico | UI sugere execucao, mas endpoint nao dispara ETL |
| `/admin/dados` | `app/src/app/(admin)/admin/dados/page.tsx` | Parcial | Dados/admin |
| `/admin/analytics` | `app/src/app/(admin)/admin/analytics/page.tsx` | Parcial | Analytics administrativo |

### 4.5 Checkout

| Rota | Arquivo | Status visual | Observacoes |
|---|---|---|---|
| `/apoio/confirmacao` | `app/src/app/(checkout)/apoio/confirmacao/page.tsx` | Critico | Mensagem de confirmacao nao reflete persistencia real do webhook |

## 5. Divida Visual Catalogada

| Tipo | Evidencia | Acao |
|---|---|---|
| Inline styles extensivos | `CamaraClient.tsx`, auth forms, home/app, perfis | Migrar gradualmente para tokens/classes/componentes |
| Cores hardcoded | Hex e rgba em varias telas civicas | Substituir por tokens globais, exceto cores partidarias justificadas |
| Emojis como icones admin | `AdminSidebar.tsx` usa icon strings | Trocar por `lucide-react` |
| Estados "em breve" | Feed civico, candidatos 2026 e areas documentadas no Lote 3 | Diferenciar visualmente prototipo vs producao |
| Componentes mistos | Base UI/shadcn + inline custom | Criar biblioteca civica comum |
| Cards aninhados/paineis densos | Algumas superficies de app/admin | Revisar layout por densidade e scan |

## 6. Regras para Novas Telas

| Elemento | Regra |
|---|---|
| Botao | Usar `components/ui/button` quando possivel |
| Badge/status | Usar `components/ui/badge` ou variante civica |
| Tabs | Usar `components/ui/tabs` |
| Dialog/sheet | Usar `components/ui/dialog`/`sheet` |
| Icones | Preferir `lucide-react`; evitar emoji funcional |
| Loading | Usar `skeleton` ou estado explicito |
| Cores | Preferir tokens; cores partidarias devem ser isoladas e nomeadas |
| Estados vazios | Usar `components/system/EmptyState` ou padrao equivalente |
| IA | Sinalizar origem IA e diferenciar cache/OpenAI |
| Dados incompletos | Exibir fonte/status, nao simular completude |

## 7. Prioridades de Migracao Visual

| Prioridade | Tela/area | Motivo |
|---|---|---|
| P0/P1 | `/apoio` e `/apoio/confirmacao` | Pagamento visual nao pode sugerir confirmacao inexistente |
| P1 | `/admin/etl` | Botao de rodar ETL deve refletir trigger real ou estado manual |
| P1 | Painel/FeedCivico | Core loop depende de feed real |
| P1 | Candidatos 2026 | Evitar percepcao de cobertura eleitoral completa |
| P2 | CamaraClient | Reduzir inline styles/hardcoded colors |
| P2 | Auth forms | Alinhar componentes e acessibilidade |
| P2 | AdminSidebar | Trocar emojis por lucide |

## 8. QA Visual Minimo

| Checagem | Criterio |
|---|---|
| Desktop/mobile | Sem sobreposicao de texto, botoes ou cards |
| Tema claro/escuro | Tokens legiveis nas superficies que usam `.theme-dark` |
| Foco teclado | Controles interativos navegaveis |
| Estados de erro | Nao dependem apenas de cor |
| Loading | Nao desloca layout de forma brusca |
| Dados ausentes | Estado vazio honesto |
| CTA financeiro | Mensagem consistente com status real do webhook |
