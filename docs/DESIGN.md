---
file: docs/DESIGN.md
module: Design System & Visual Reference
status: Active
related: [docs/design/wireframes.md, docs/design/branding.md, docs/DEPENDENCIES.md]
---

# Design System — Referência

---

## 1. Documentos de design

| Documento | Localização | Conteúdo |
|---|---|---|
| Wireframes detalhados | `docs/design/wireframes.md` | Estrutura de cada tela, decisões aprovadas, cores de badges |
| Identidade da marca | `docs/design/branding.md` | Posicionamento, paleta, tipografia, tom de voz, manifesto |
| Mapeamento wireframe → rota | `docs/stitch_wireframes_match.csv` | Status de implementação de cada wireframe |
| Assets de logo | `docs/branding/` | PNGs em variações de cor e fundo |

---

## 2. Cobertura dos wireframes

O arquivo `docs/stitch_wireframes_match.csv` registra 104 wireframes e componentes catalogados.

### Resumo por status

| Status | Quantidade | Significado |
|---|---|---|
| `match-direto` | 53 | Wireframe tem rota correspondente implementada fielmente |
| `match-parcial` | 16 | Rota existe mas diverge do wireframe (variantes não 1:1) |
| `gap` | 26 | Wireframe sem rota — feature ainda não implementada |
| `nao-pagina` | 9 | Asset de layout ou componente de design (não é uma rota) |

### Distribuição por produto

**Site público (`meuspoliticos.com.br`):**
Maior parte dos `match-direto` — home, busca, glossário, estados, projetos, candidatos 2026, páginas institucionais, autenticação.

**App analítico (`app.meuspoliticos.com.br`):**
Comparador, proposições, painel pessoal — `match-direto`. Perfil do político — `match-parcial` (múltiplas variantes de wireframe apontam para a mesma rota `/politicos/[id]`).

**Suite de Inteligência (Terminal de Inteligência):**
Todo o módulo está em `gap` — produto não iniciado. Inclui busca avançada, dossier do parlamentar, explorador de legislação, home analítica, matriz de confronto e monitoramento de alertas.

### Gaps significativos

| Feature | Wireframes | Rota planejada |
|---|---|---|
| Suite de Inteligência | 12 wireframes | `(app)/` — produto futuro |
| Módulo de Partidos | 4 wireframes | `/partidos/[sigla]` |
| Perfil do candidato 2026 (individual) | 1 wireframe | `/candidatos-2026/[slug]` — rota existe mas incompleta (G-05) |
| FAQ | 1 wireframe | `/faq` |
| Sustentabilidade Cívica | 2 wireframes | `/sustentabilidade` |
| Ranking de municípios (emendas) | 1 wireframe | Não planejado |
| Mapa do Brasil interativo standalone | 1 wireframe | Não planejado |

### Match-parcial — detalhes

| Wireframe(s) | Rota | Divergência |
|---|---|---|
| `central_analitica_cockpit_1/2` + `perfil_poder` + `perfil_analitico_intel_1/2` + 6 variantes de cargo | `/politicos/[id]` | Múltiplas variantes de wireframe por cargo (dep. federal, senador, dep. estadual, vereador, prefeito, governador) — implementação unificada em uma rota |
| `checkout_apoio` + `confirmacao_apoio` + `confirmacao_sucesso` | `/apoio/confirmacao` | Fluxo de apoio sem rota dedicada de checkout |
| `perfil_candidato_2026` | `/candidatos-2026` | Falta rota `/candidatos-2026/[slug]` — perfil individual |

---

## 3. Identidade visual

Referência completa em `docs/design/branding.md`. Resumo dos pontos de implementação:

### 3.1 Paleta de cores

| Token | Uso | Referência |
|---|---|---|
| Navy (`#1a2b5e` approx.) | Hero sections, navbar, badges de cargos federais | `globals.css :root` |
| Verde institucional | Badges estaduais, presença acima da média (≥80%) | `globals.css :root` |
| Âmbar | Alertas, badge "IA", tag "ELEIÇÕES 2026", presença 60–79% | `globals.css :root` |
| Vermelho | Erros, presença abaixo da média (<60%), status ETL com falha | `globals.css :root` |
| Cinza neutro | Textos secundários, bordas, estado "sem dados" | `globals.css :root` |

> Para os tokens exatos, ler `app/src/app/globals.css` seção `:root`.

### 3.2 Badges de cargo — cores aprovadas

Definidas em `docs/design/wireframes.md §1`:

| Cargo | Fundo | Texto |
|---|---|---|
| Dep. Federal | `#e8eefb` | `#1a2b5e` |
| Senador | `#e8f5ee` | `#085041` |
| Governador | `#fff0e8` | `#7a3000` |
| Prefeito | `#f0e8ff` | `#3c1489` |
| Dep. Estadual | `#fef9e8` | `#7a6000` |
| Vereador | `#fce8f0` | `#7a0040` |

### 3.3 Cores de presença

| Faixa | Cor | Significado |
|---|---|---|
| ≥ 80% | Verde | Acima da média |
| 60–79% | Âmbar | Dentro da média |
| < 60% | Vermelho | Abaixo da média |
| Sem dado | Cinza + "–" | Dados não disponíveis |

### 3.4 Tipografia

Fonte padrão: **Inter** (sans-serif, geométrica, alta legibilidade). Configurada via Tailwind. Font-size mínimo em campos de formulário: `16px` (evita zoom automático no iOS).

---

## 4. Assets de logo

Localizados em `docs/branding/`. Todos em PNG de alta resolução.

| Arquivo | Variação | Uso recomendado |
|---|---|---|
| `logos_meus-politicos_colorido_fundobranco.png` | Colorido · Fundo branco | Documentos, e-mails, fundo claro |
| `logos_meus-politicos_colorido_semfundo.png` | Colorido · Sem fundo (PNG transparente) | Site, app (light mode) |
| `logos_meus-politicos_preto_fundobranco.png` | Preto · Fundo branco | Impressão P&B, contratos |
| `logos_meus-politicos_preto_semfundo.png` | Preto · Sem fundo | Fundos escuros, hero sections |
| `logos_meus-politicos_iconecolorido_fundobranco.png` | Apenas ícone · Fundo branco | Favicon, app icon (fallback) |
| `logos_meus-politicos_iconecolorido_semfundo.png` | Apenas ícone · Sem fundo | Avatar, favicon SVG |
| `logos_matirz_meus-politicos.png` | Matriz completa de variações | Referência para design |
| `apple-icon.png` | Apple Touch Icon | `<head>` do Next.js |
| `favicon.ico` | Favicon legado | `<head>` do Next.js |
| `icon.png` | Ícone genérico | `<head>` do Next.js |

Assets do Next.js (`apple-icon.png`, `favicon.ico`, `icon.png`) estão em `docs/branding/` como referência — os arquivos ativos estão em `app/public/` (ou `app/src/app/` para Next.js App Router icon conventions).

---

## 5. Component library

### 5.1 Stack de componentes

| Biblioteca | Versão | Papel |
|---|---|---|
| `shadcn` | ^4.7.0 | CLI de componentes acessíveis — gera código em `src/components/ui/` |
| `@base-ui/react` | ^1.4.1 | Primitivos headless sem estilo (alternativa ao Radix, do time do MUI) |
| `lucide-react` | ^1.14.0 | Ícones SVG — padrão do projeto |
| `framer-motion` | ^12.38.0 | Animações — carrosséis, transições de página |
| `class-variance-authority` | ^0.7.1 | Variantes tipadas de componentes |
| `tailwind-merge` | ^3.6.0 | Merge de classes Tailwind sem conflito |

### 5.2 Componentes cívicos

Componentes específicos do domínio político em `app/src/components/civic/`. Sempre verificar aqui antes de criar novo componente visual — per `app/CLAUDE.md`.

### 5.3 Componentes de site

Componentes compartilhados entre páginas do site público em `app/src/components/site/`:

| Componente | Arquivo | Uso |
|---|---|---|
| Header do site | `SiteHeader.tsx` | Navegação principal (site público) |
| Footer do site | `SiteFooter.tsx` | Rodapé com links e botão Apoie |
| Banner de apoio | `ApoioBanner.tsx` | CTA de doação |
| Botões de carrossel | `CarouselBtn.tsx` | Navegação de cards |
| Tabs do dep. estadual | `DeputadoEstadualTabs.tsx` | Abas do perfil |
| Âncora de navegação | `EstadoAnchorNav.tsx` | Navegação interna da página de estado |

---

## 6. Diretrizes de design por tela

### 6.1 Hero sections

Todas as heroes principais usam fundo azul navy com texto branco — estabelece identidade institucional consistente em: Home, Perfil do Político, Quem me Representa, Candidato 2026, Login/Cadastro.

### 6.2 "Em breve" — padrão de honestidade

Cards e abas de features não implementadas exibem badge "Em breve" com estado visual desabilitado — nunca 404 silencioso. Aplicado em: abas Emendas e Histórico no perfil; nível Municipal em /meu-estado; cargos sem dados no grid da home.

### 6.3 Rastreabilidade obrigatória

Todo dado exibido deve ter link para a fonte oficial. Aplicado via nota de rodapé ou link inline em: votações, gastos, presença, proposições, candidatos TSE.

### 6.4 Badge "IA" obrigatório

Todo conteúdo gerado por IA (resumos de proposições, resumo de candidato, resumo interpretativo de perfil) exibe badge "Gerado por IA" com link para a fonte original. Invariante definida em `docs/INTEGRATIONS.md §4`.

### 6.5 Nota de neutralidade — candidatos 2026

Banner âmbar fixo na aba Proposta do candidato 2026:
> "O resumo foi gerado por IA a partir da proposta oficial do TSE. A plataforma não avalia, ranqueia ou recomenda candidatos. Todos os dados são de fontes oficiais."

Candidatos exibidos em ordem **alfabética** em todas as listagens — sem ordenação por relevância.

---

## 7. Mobile first

Breakpoints (de `docs/design/wireframes.md §10`):

| Breakpoint | Faixa | Prioridade |
|---|---|---|
| Mobile | 375–430px | Máxima — layout principal |
| Tablet | 768px | Grids expandem |
| Desktop | 1024px+ | Layout completo |

**Regras obrigatórias:**
- Fonte mínima: 12px
- Área de toque mínima: 44×44px
- Scroll horizontal: evitar (exceção: chips de filtro)
- Font-size em inputs: 16px (evita zoom iOS)
- Cards: coluna única no mobile

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
