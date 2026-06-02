---
file: docs/DEPENDENCIES.md
module: Dependency Audit
status: Active
related: [package.json, app/package.json, package-lock.json, app/package-lock.json, docs/DEPLOYMENT.md, docs/ARCHITECTURE.md]
---

# Dependencias

Este documento audita os `package.json` da raiz e do workspace `app`, com foco em stack real, pacotes orfaos, licencas e riscos de compatibilidade com React 19 e Next.js 16.

## 1. Estrutura de Pacotes

| Arquivo | Papel |
|---|---|
| `package.json` | Monorepo raiz com workspace `app` e scripts delegados |
| `app/package.json` | Aplicacao Next.js real |
| `package-lock.json` | Lock raiz |
| `app/package-lock.json` | Lock do workspace app |

## 2. Scripts

| Local | Script | Comando |
|---|---|---|
| raiz | `dev` | `npm --prefix app run dev` |
| raiz | `build` | `npm --prefix app run build` |
| raiz | `start` | `npm --prefix app run start` |
| raiz | `lint` | `npm --prefix app run lint` |
| app | `dev` | `next dev` |
| app | `build` | `next build` |
| app | `start` | `next start` |
| app | `lint` | `eslint` |

## 3. Dependencias da Raiz

| Pacote | Versao | Uso identificado | Classificacao |
|---|---:|---|---|
| `next` | `16.2.6` em `devDependencies` | Duplicado conceitualmente com `app/package.json` | Revisar |
| `prop-types` | `^15.8.1` | Nenhum uso identificado em `app/src` | Orfao provavel |

Recomendacao: remover `prop-types` da raiz se nenhum pacote workspace exigir. Manter `next` na raiz apenas se houver motivo de tooling; a aplicacao real ja declara `next`.

## 4. Dependencias de Producao do App

| Pacote | Versao | Uso real identificado | Risco React 19 / Next 16 | Licenca esperada/auditoria |
|---|---:|---|---|---|
| `next` | `16.2.6` | Framework principal | Critico: APIs App Router/cache/proxy mudam rapido | MIT |
| `react` | `19.2.4` | UI principal | Critico: exige libs compativeis com React 19 | MIT |
| `react-dom` | `19.2.4` | DOM renderer | Critico | MIT |
| `@logto/next` | `^4.2.10` | Auth server-actions/edge | Alto: precisa compatibilidade com Next 16 server actions/edge | Ver lock; pacote Logto geralmente open-source, confirmar antes de compliance formal |
| `pg` | `^8.20.0` | PostgreSQL direto | Baixo com React; medio operacional por conexoes serverless | MIT |
| `openai` | `^6.37.0` | Server Action/ETL JS | Baixo com React; alto custo/segredo | Apache-2.0/MIT conforme pacote; confirmar em lock antes de auditoria legal |
| `zod` | `^4.4.3` | Validacao IA/server action | Baixo | MIT |
| `@base-ui/react` | `^1.4.1` | Primitivos UI locais | Medio: confirmar suporte React 19 | MIT provavel |
| `class-variance-authority` | `^0.7.1` | Variantes de UI | Baixo | Apache-2.0/MIT conforme pacote; confirmar |
| `clsx` | `^2.1.1` | `cn()` | Baixo | MIT |
| `tailwind-merge` | `^3.6.0` | `cn()` | Baixo | MIT |
| `tailwindcss` | dev `^4` | CSS framework | Medio: binarios nativos exigem cuidado na Vercel | MIT |
| `tw-animate-css` | `^1.4.0` | Importado em `globals.css` | Baixo | MIT provavel |
| `shadcn` | `^4.7.0` | CLI/import CSS shadcn | Medio: confirmar escopo runtime vs CLI | MIT |
| `lucide-react` | `^1.14.0` | Icones amplamente usados | Baixo; confirmar React 19 | ISC/MIT historicamente; confirmar lock |
| `framer-motion` | `^12.38.0` | `ResumoInterpretativoCard.tsx` | Medio: React 19 e bundle/animations | MIT |
| `date-fns` | `^4.1.0` | Formatacao em `politico-v2/shared.ts` | Baixo | MIT |
| `react-simple-maps` | `^3.0.0` | `BrazilDots.tsx` | Medio: pacote antigo pode exigir peers React <=18 | MIT |
| `recharts` | `^3.8.1` | Uso direto nao confirmado na varredura rapida | Medio: React 19/charting | MIT |
| `react-hook-form` | `^7.75.0` | Uso direto nao confirmado na varredura rapida | Medio: se nao usado, orfao | MIT |
| `@hookform/resolvers` | `^5.2.2` | Uso direto nao confirmado na varredura rapida | Medio: depende de RHF/Zod | MIT |

## 5. DevDependencies do App

| Pacote | Versao | Papel | Risco |
|---|---:|---|---|
| `typescript` | `^5` | Type checking | Baixo |
| `eslint` | `^9` | Lint | Medio: flat config e Next 16 |
| `eslint-config-next` | `16.2.6` | Regras Next | Baixo se alinhado ao Next |
| `@types/react` | `^19` | Tipos React | Baixo |
| `@types/react-dom` | `^19` | Tipos React DOM | Baixo |
| `@types/node` | `^20` | Tipos Node | Baixo |
| `@types/pg` | `^8.20.0` | Tipos PostgreSQL | Baixo |
| `@tailwindcss/postcss` | `^4` | PostCSS Tailwind v4 | Medio por toolchain |

## 6. OptionalDependencies

| Pacote | Papel | Motivo operacional |
|---|---|---|
| `@tailwindcss/oxide-linux-x64-gnu` | Binario Tailwind Linux glibc | Necessario/forcado na Vercel |
| `@tailwindcss/oxide-linux-x64-musl` | Binario Tailwind Linux musl | Necessario/forcado na Vercel |
| `lightningcss-linux-x64-gnu` | Binario Lightning CSS glibc | Necessario/forcado na Vercel |
| `lightningcss-linux-x64-musl` | Binario Lightning CSS musl | Necessario/forcado na Vercel |

O `vercel.json` instala esses pacotes explicitamente com `npm i --no-save`, o que reduz falhas de build, mas precisa permanecer sincronizado com as versoes declaradas.

## 7. Pacotes Orfaos ou Subutilizados

| Pacote | Evidencia | Classificacao | Acao |
|---|---|---|---|
| `prop-types` na raiz | Nenhum uso identificado em `app/src` | Orfao provavel | Remover apos `npm ls prop-types` e build |
| `react-hook-form` | Nenhum import direto encontrado na varredura rapida | Orfao possivel | Confirmar antes de remover; forms atuais usam `useState` |
| `@hookform/resolvers` | Nenhum import direto encontrado | Orfao possivel | Remover junto com RHF se confirmado |
| `recharts` | Nenhum import direto encontrado no scan focado | Orfao possivel | Confirmar se graficos futuros/admin dependem |
| `next` devDependency raiz | App ja declara `next` | Duplicacao possivel | Manter apenas se tooling raiz exigir |
| `shadcn` em dependencies | CLI normalmente e dev/tooling | Reclassificacao possivel | Avaliar mover para `devDependencies` se nao for runtime |

## 8. Dependencias Criticas

| Pacote | Por que e critico | Falha esperada |
|---|---|---|
| `next@16.2.6` | Framework e build | Build/runtime quebrado |
| `react@19.2.4`/`react-dom@19.2.4` | UI | Incompatibilidade de libs e hydration |
| `@logto/next` | Auth | Login/painel/admin indisponiveis |
| `pg` | Dados | Busca/perfis/admin/painel falham |
| `openai` | IA | Resumo interpretativo indisponivel |
| `tailwindcss@4` + oxide/lightningcss | CSS/build | Build Vercel falha |
| `@base-ui/react` | Componentes UI | Botao/tabs/dialog/sheet/input podem quebrar |

## 9. Riscos React 19 / Next.js 16

| Area | Risco | Evidencia | Mitigacao |
|---|---|---|---|
| Peer dependencies | Bibliotecas podem declarar React 18 | `react-simple-maps`, charting e UI libs merecem verificacao | Rodar `npm ls` e build |
| Server Actions | SDKs precisam suportar Next 16 | `@logto/next/server-actions`, `resumo-interpretativo.ts` | Testar login/build |
| Edge runtime | Logto Edge client no proxy | `proxy-session.ts` | Testar hosts painel/app/site |
| Tailwind v4 | Binarios nativos | `vercel.json` installCommand | Manter optional deps |
| Turbopack/dev | Next 16 muda defaults | `next dev` | Validar em dev local |
| Hydration | Inline styles/client state extenso | Muitos componentes client | Browser QA em rotas principais |

## 10. Licencas

### 10.1 Resultado do Lockfile

A varredura de `package-lock.json` e `app/package-lock.json` encontrou predominancia de licencas permissivas:

| Licenca encontrada | Risco geral |
|---|---|
| MIT | Baixo |
| ISC | Baixo |
| Apache-2.0 | Baixo/medio por notice |
| BSD-2-Clause/BSD-3-Clause | Baixo |
| MPL-2.0 | Medio; exige atencao a copyleft em arquivos modificados |
| CC0-1.0/0BSD | Baixo |
| BlueOak-1.0.0 | Baixo/medio; revisar politica interna |
| Python-2.0 | Medio; revisar pacote transitive especifico |

### 10.2 Recomendacao de Compliance

| Acao | Prioridade |
|---|---|
| Gerar SBOM ou relatorio `license-checker` em CI | P1 |
| Identificar quais pacotes trazem MPL-2.0/Python-2.0/BlueOak | P1 |
| Registrar notices Apache/BSD se produto exigir | P2 |
| Bloquear licencas copyleft fortes nao aprovadas | P2 |

## 11. Dependencias Python ETL

Nao ha `requirements.txt` consolidado identificado neste lote. Pelos scripts, dependencias provaveis incluem:

| Pacote/ecossistema | Evidencia |
|---|---|
| `psycopg` | Conexoes PostgreSQL nos scripts ETL |
| `openai` Python | `etl/ia/simplificar_proposicoes.py` |
| `requests`/HTTP libs | Coletas de APIs publicas |
| `python-dotenv` possivel | Mensagens/uso de `.env.local` em ETL IA |

Recomendacao: criar `etl/requirements.txt` ou `pyproject.toml` com versoes travadas, separar ambiente ETL do ambiente Node e documentar comandos por fonte.

## 12. Plano de Saneamento

| Prioridade | Acao |
|---|---|
| P1 | Rodar `npm ls`/build apos remover candidatos orfaos |
| P1 | Confirmar compatibilidade peer de `react-simple-maps`, `recharts`, `framer-motion`, `@base-ui/react` com React 19 |
| P1 | Mover `shadcn` para devDependency se for apenas CLI/tooling |
| P1 | Remover `prop-types` da raiz se confirmado sem uso |
| P2 | Criar relatorio de licencas automatizado |
| P2 | Criar lockfile/requirements do ETL Python |
