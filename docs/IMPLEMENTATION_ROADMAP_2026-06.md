---
file: docs/IMPLEMENTATION_ROADMAP_2026-06.md
module: Implementation Roadmap
status: Active
related: [README.md, docs/TODO_PRODUCTION.md, docs/MODERNIZATION_ROADMAP.md, docs/INVENTORY_ROUTES.md, docs/DESIGN.md, docs/TESTING.md]
---

# Roteiro de Implementacao 2026-06

## Objetivo

Levar o Meus Politicos do beta tecnico atual para uma versao publicavel, mobile-first,
com rotas coerentes, core loop testado, dados operaveis e promessas de produto
compatíveis com a implementacao real.

O trabalho deve seguir esta ordem:

1. Corrigir navegacao quebrada e remover rotas descontinuadas.
2. Estabelecer a fundacao mobile-first e auditar todas as telas.
3. Eliminar erros de lint e criar a primeira camada de testes.
4. Fechar o core loop publico e autenticado.
5. Resolver pagamentos, seguranca, banco e autenticacao.
6. Automatizar ETL e observabilidade.
7. Revisar modulos secundarios e preparar o go-live.

## Diagnostico Confirmado

### Busca e rota `/meu-estado`

`/meu-estado` foi encontrada ativa no codigo e na documentacao, apesar de ter sido
descontinuada na direcao atual do produto. O saneamento foi implementado em
2026-06-12.

Referencias ativas:

| Origem | Comportamento atual |
|---|---|
| `HomeCidadaoClient.tsx` | Corrigido: pesquisa textual usa `/busca` |
| `HomeApp.tsx` | Corrigido: aba de CEP removida |
| `components/meu-estado` | Removido por nao possuir consumidores ativos |
| `AppHeader.tsx` | Corrigido: item substituido por `Estados` |
| `app/(site)/meu-estado/page.tsx` | Corrigido: redirect permanente para `/estado` |
| Documentacao | Inventarios ativos atualizados; artefatos historicos preservados |

A busca por nome nao possui esse desvio: ela navega para `/busca?q=...`. O desvio
acontece especificamente quando a entrada e reconhecida como CEP.

### Responsividade

O projeto nao possui garantia mobile-first. Foram encontrados 194 sinais de risco
em TSX, incluindo larguras fixas, grids densos, tabelas e regras de overflow.
Build bem-sucedido nao valida responsividade.

### Qualidade automatizada

| Verificacao | Estado em 2026-06-11 |
|---|---|
| Build Next.js | Passa |
| ESLint | Falha com 75 erros e 137 avisos |
| Testes unitarios | Nao configurados |
| Testes E2E | Nao configurados |
| Testes visuais | Nao configurados |
| CI | Nao confirmada |

## Regras De Execucao

- Novas telas e correcoes devem partir de 320-375 px e expandir por breakpoint.
- Nenhuma fase pode adicionar novas paginas de produto antes de estabilizar as rotas core.
- Cada pagina corrigida deve ter estados loading, vazio, erro e dados longos verificados.
- Conteudo incompleto deve ser removido da navegacao ou sinalizado honestamente.
- A conclusao de uma fase exige build, lint do escopo e QA nos viewports definidos.
- Alteracoes de banco, pagamento, auth e ETL exigem ambiente controlado e rollback.

## Fase 0 - Saneamento De Rotas

Prioridade: imediata.

### Decisao de produto

A rota canonica de descoberta deve ser:

- `/busca` para encontrar politicos por nome, cargo, partido e UF.
- `/estado` e `/estado/[sigla]` para navegacao territorial.
- `/cidades` e `/estado/[sigla]/[slug_cidade]` para cobertura municipal.

CEP nao deve continuar levando a uma pagina descontinuada. Ate existir um fluxo
canonico de resolucao CEP -> cidade, a home deve solicitar nome de politico, cargo,
partido ou UF, sem prometer busca por CEP.

### Implementacao

- Remover a promessa de CEP da home publica e da home analitica.
- Fazer toda busca textual usar `/busca?q=...`.
- Remover `Meu estado` do header e demais menus.
- Substituir links validos por `/estado`, `/cidades` ou `/busca`, conforme a intencao.
- Transformar `/meu-estado` em redirect permanente para `/estado`.
- Remover componentes `components/meu-estado` quando nao houver mais consumidores.
- Atualizar sitemap, inventarios, testes, wireframes ativos e documentacao de dominio.
- Criar uma tabela de rotas canonicas, legadas e redirects.
- Auditar links internos para rotas inexistentes, antigas ou duplicadas.

### Criterio de aceite

- Nenhum link ou formulario novo navega para `/meu-estado`.
- Acesso direto a `/meu-estado` retorna redirect permanente para `/estado`.
- Busca por nome sempre abre `/busca`.
- Menus desktop e mobile exibem as mesmas rotas canonicas.
- Teste E2E cobre home -> busca -> resultados.

## Fase 1 - Fundacao Mobile-First

Prioridade: P0 de experiencia.

### Breakpoints de validacao

| Viewport | Uso |
|---:|---|
| 320 x 568 | menor largura suportada |
| 375 x 812 | celular principal |
| 390 x 844 | celular moderno |
| 768 x 1024 | tablet |
| 1024 x 768 | desktop compacto |
| 1440 x 900 | desktop amplo |

### Fundacao global

- Definir containers, gutters e espacamentos mobile-first em `globals.css`.
- Garantir `box-sizing: border-box`, imagens fluidas e quebra de palavras longas.
- Proibir overflow horizontal no documento sem mascarar bugs com `overflow-x: hidden`.
- Definir escala tipografica responsiva e limites de largura de leitura.
- Padronizar botoes e inputs com alvo minimo de 44 x 44 px.
- Criar primitivas para `PageContainer`, `ResponsiveStack`, `DataTable` e `MobileSheet`.
- Padronizar navegacao mobile para site, app, painel e admin.
- Tratar safe areas, teclado virtual, foco e barras sticky em celulares.

### Padroes por componente

- Tabelas: cards no mobile ou scroll local com coluna primaria fixa.
- Filtros: resumo + sheet/drawer no mobile; barra completa apenas em telas maiores.
- Graficos: largura fluida, legenda reduzida e fallback tabular acessivel.
- Cards: uma coluna por padrao; duas ou mais apenas em breakpoints maiores.
- Tabs: scroll horizontal local ou seletor compacto.
- Dialogs: fullscreen/sheet em celular.
- Sidebars: drawer no mobile, nunca largura fixa ocupando o viewport.
- Comparacoes: selecao progressiva e cards empilhados antes da matriz desktop.

### Criterio de aceite

- Nenhuma rota core gera overflow horizontal em 320 px.
- Nenhum CTA primario fica fora do viewport ou encoberto.
- Menus, filtros e dialogs funcionam por toque e teclado.
- Lighthouse mobile nao aponta falhas criticas de viewport ou tap targets.

## Fase 2 - Auditoria Responsiva Pagina Por Pagina

### Lote A - Core publico

1. `/`
2. `/busca`
3. `/politicos/[id]`
4. `/projetos`
5. `/projetos/[slug]`
6. `/partidos`
7. `/partidos/[sigla]`
8. `/estado`
9. `/estado/[sigla]`

Foco: hero, busca, autocomplete, filtros sticky, cards, tabs, graficos, tabelas e
conteudo com nomes extensos.

### Lote B - Territorio e legislativo

1. `/camara` e comissoes
2. `/senado` e comissoes
3. `/estado/[sigla]/assembleia`
4. `/estado/[sigla]/assembleia/[slug]`
5. `/estado/[sigla]/executivo`
6. `/estado/[sigla]/[slug_cidade]`
7. Rotas de camaras municipais e vereadores
8. `/cidades`
9. `/emendas` e `/emendas/[id]`

Foco: dashboards densos, mapas, rankings, tabelas e navegacao hierarquica.

### Lote C - Eleicoes e conteudo

1. `/eleicao/2026` e subrotas
2. Candidatos e paginas estaduais
3. `/glossario` e verbetes
4. `/noticias`
5. `/insights`
6. Paginas institucionais, legais e de metodologia

Foco: declarar cobertura real, remover placeholders e garantir leitura editorial.

### Lote D - Painel e autenticacao

1. Login, cadastro e recuperacao
2. `/painel`
3. `/painel/meus-politicos`
4. `/painel/politicos/[id]`
5. `/painel/comparar`
6. `/conta`

Foco: navegacao autenticada mobile, feed, cards acompanhados, formularios e estados vazios.

### Lote E - Admin e apoio

1. `/admin` e subrotas
2. `/apoio`
3. `/apoio/confirmacao`
4. Estados de erro, manutencao e indisponibilidade

Foco: tabelas administrativas, operacoes perigosas, checkout e mensagens honestas.

### Definition of Done por pagina

- 320, 375, 768, 1024 e 1440 px revisados.
- Sem overflow global, sobreposicao ou texto truncado sem alternativa.
- Header, footer, breadcrumbs e navegacao secundaria funcionais.
- Loading, vazio, erro, dados longos e ausencia de imagem testados.
- Navegacao por teclado, foco visivel, labels e contraste basico verificados.
- Screenshot de referencia aprovada nos viewports principais.

## Fase 3 - Qualidade De Codigo

- Excluir ou adequar `scratch` ao escopo do ESLint.
- Corrigir os 75 erros antes de tratar avisos cosmeticos.
- Eliminar `any` em contratos de API, banco e componentes core.
- Corrigir efeitos que atualizam estado de forma sincrona.
- Remover funcoes impuras durante render.
- Corrigir hooks com dependencias incompletas.
- Substituir imports, variaveis e componentes mortos.
- Tratar `<img>` em conteudo relevante com `next/image` ou loader adequado.
- Corrigir warning depreciado do Sentry para Turbopack.
- Adicionar scripts `typecheck`, `test`, `test:e2e` e `test:visual`.

### Criterio de aceite

- `npm run lint` passa sem erros.
- `npm run build` passa sem warnings operacionais relevantes.
- `npm run typecheck` existe e passa.

## Fase 4 - Testes E CI

### Testes unitarios

- Utilitarios de formatacao, datas, slugs e parametros.
- Schemas Zod e validacao de payloads.
- Regras de metricas documentadas.
- Sanitizacao de redirects e resolucao de rotas canonicas.

### Testes de integracao

- `/api/busca`.
- Acompanhamentos.
- Provisionamento e RBAC.
- Pagamentos e idempotencia.
- Cron/ETL e autorizacao.

### E2E com Playwright

- Home -> busca -> perfil.
- Perfil -> login -> acompanhar -> painel.
- Remover acompanhamento.
- Navegacao por estado, cidade e eleicao.
- Apoio com provider simulado.
- Admin permitido e negado.
- Redirects de rotas legadas.

### Testes responsivos

- Executar rotas em 320, 375, 768 e 1440 px.
- Falhar ao detectar `document.documentElement.scrollWidth > innerWidth`.
- Capturar screenshots das rotas core.
- Testar menu mobile, filtros, sheets, tabs, dialogs e tabelas.

### CI

- Instalar dependencias com lockfile.
- Rodar lint, typecheck, testes unitarios e build.
- Rodar E2E contra ambiente controlado.
- Publicar preview e screenshots para revisao.

## Fase 5 - Core Loop De Produto

- Consolidar contrato e UX de `/busca`.
- Garantir perfis com fonte, atualizacao e estado de dado ausente.
- Validar login, cadastro, callback, logout e recuperacao Logto.
- Validar usuario novo e legado.
- Garantir follow/unfollow idempotente.
- Conectar painel a eventos civicos reais.
- Implementar estados honestos quando nao houver eventos.
- Remover mocks e CTAs sem destino do fluxo core.

### Criterio de aceite

Um usuario em celular consegue buscar, entender um perfil, autenticar, acompanhar
um politico e ver esse acompanhamento no painel sem bloqueios.

## Fase 6 - Seguranca, Banco E Pagamentos

- Encerrar formalmente o incidente da chave Resend legada.
- Repetir varredura de segredos no workspace e historico.
- Centralizar acesso PostgreSQL em `lib/db`.
- Definir timeouts, SSL, pool, observabilidade e erros publicos seguros.
- Validar migrations e grants em ambiente explicitamente nao produtivo.
- Revisar RLS legado versus Logto e acesso direto por `pg`.
- Persistir doacoes com identificador unico e idempotencia.
- Validar autenticidade do webhook do provedor ou documentar controle compensatorio.
- Fazer confirmacao financeira depender do estado persistido.
- Adicionar rate limit a APIs publicas e sensiveis.
- Definir CSP e headers de seguranca.

## Fase 7 - ETL, Dados E Observabilidade

- Definir n8n/runner como orquestrador oficial.
- Criar estado de job com inicio, fim, fonte, status, erro sanitizado e lock.
- Fazer admin disparar job real ou remover a acao.
- Unificar contrato de variaveis `POSTGRES_*`.
- Tornar ambiente Python reproduzivel.
- Agendar fontes por SLA e dependencia.
- Alertar coleta atrasada, falha e volume anormal.
- Exibir data e fonte dos dados no produto.
- Monitorar Sentry, uptime, Web Vitals e APIs criticas.
- Definir retencao e privacidade para analytics.

## Fase 8 - Revisao De Escopo

Cada modulo secundario deve receber uma decisao explicita:

| Decisao | Acao |
|---|---|
| Produzir agora | Completar dados, responsividade, testes e operacao |
| Beta publico | Manter com badge de cobertura e limitacoes claras |
| Ocultar | Remover de menus, sitemap e CTAs |
| Descontinuar | Redirect, remocao de codigo e atualizacao documental |

Aplicar a decisao a eleicoes, noticias, insights, IA, comparacao, assembleias,
municipios, apoio e secoes incompletas de perfis.

## Fase 9 - Go-Live

- Fechar checklist de ambiente Vercel e dominios.
- Eliminar duplicidade entre configs Vercel da raiz e de `app`.
- Validar rollback e backup do banco.
- Executar smoke test em producao.
- Revisar SEO, robots, sitemap, canonical e redirects.
- Revisar LGPD, cookies, termos e privacidade.
- Medir Lighthouse mobile nas rotas core.
- Congelar novas features durante a janela de estabilizacao.

### Condicoes de go

- Zero bloqueadores P0 abertos.
- Lint, typecheck, testes e build verdes no CI.
- Rotas core aprovadas em 320 e 375 px.
- Core loop E2E aprovado.
- Pagamento persistente e reconciliavel.
- Auth e RBAC validados.
- ETLs criticos com status e alerta.
- Nenhuma rota descontinuada permanece na navegacao.

## Ordem Recomendada De Entrega

| Marco | Escopo | Estimativa |
|---|---|---:|
| M1 | Rotas legadas, busca e fundacao mobile | 3-5 dias |
| M2 | Core publico responsivo | 8-12 dias |
| M3 | Painel, auth e admin responsivos | 6-9 dias |
| M4 | Lint, testes e CI | 6-10 dias |
| M5 | Core loop, seguranca, banco e pagamentos | 8-12 dias |
| M6 | ETL, observabilidade e dados | 8-12 dias |
| M7 | Modulos secundarios e go-live | 6-10 dias |

Estimativa total: 45-70 dias uteis para uma pessoa, dependendo da cobertura de
dados, acesso aos provedores e nivel de acabamento visual. Frentes independentes
podem reduzir o calendario com trabalho paralelo.

## Primeiro Ciclo De Execucao

1. Remover o desvio por CEP e aposentar `/meu-estado`.
2. Corrigir header, menus, sitemap e referencias documentais.
3. Criar harness Playwright para viewports e overflow.
4. Corrigir responsividade de `/`, `/busca` e `/politicos/[id]`.
5. Corrigir os erros de lint tocados pelo lote.
6. Validar home -> busca -> perfil em mobile e desktop.
7. Prosseguir para painel e autenticacao.
