---
file: docs/PLACEHOLDER_REPORT.md
module: Placeholder Report
status: Active
related: [docs/INVENTORY_ROUTES.md, docs/INVENTORY_FEATURES.md, docs/GAP_ANALYSIS.md, docs/MVP_REAL_IDENTIFICADO.md]
---

# Placeholder Report

Data do inventario: 2026-06-02.

Este documento mapeia debito visual e funcional visivel na UI: TODOs, mocks, `href="#"`, botoes sem acao, estados "em breve", placeholders de conteudo e promessas de produto ainda nao conectadas a dados reais. Placeholders normais de campos de formulario, como `placeholder="Seu e-mail"`, foram classificados como **baixo risco** quando nao representam funcionalidade incompleta.

## Resumo Executivo

| Categoria | Quantidade identificada | Severidade dominante | Veredito |
|---|---:|---|---|
| TODO funcional em runtime | 1 | P0 | Webhook InfinitePay nao persiste doacao |
| Dados mockados/estaticos com cara de produto real | 3 areas | P1/P2 | Home app, alertas, proximas votacoes |
| Links inativos `href="#"` | 2 | P1 | Candidato 2026 |
| Botao sem acao efetiva | 4+ | P1/P2 | Chat candidato, + Novo alerta, botoes CTA sem handler claro |
| Estados "em breve" | 15+ | P2 | Painel, estados, partidos, perfil app, projetos |
| Placeholders de layout/visualizacao | 8+ | P2/P3 | Heatmaps, mapa, contexto legal, ratios |
| Placeholders de formulario aceitaveis | 15+ | P4 | Campos de input sem debito funcional |

## Criterios De Classificacao

| Severidade | Definicao |
|---|---|
| P0 | Pode causar perda de dados, perda financeira, inconsistencia grave ou promessa critica falsa |
| P1 | Quebra fluxo relevante do usuario ou backoffice |
| P2 | Promessa visual/funcional incompleta, mas com workaround ou impacto localizado |
| P3 | Debito visual/UX que reduz polimento, sem bloquear core loop |
| P4 | Placeholder tecnico aceitavel, como texto de input |

## TODOs E Mocks

| Arquivo:linha | Tipo | Descricao | Impacto | Severidade | Acao recomendada |
|---|---|---|---|---|---|
| `app/src/app/api/webhooks/infinitepay/route.ts:34` | TODO funcional | `// TODO: registrar doação no banco de dados` | Pagamento confirmado pelo gateway nao vira registro em banco; perda de historico financeiro | P0 | Criar/padronizar tabela `doacoes`, persistir idempotente por `order_nsu`, validar autenticidade do webhook |
| `app/src/app/api/webhooks/infinitepay/route.ts:35` | Codigo comentado | `await db.from('doacoes').upsert(...)` comentado | Indica desenho antigo Supabase, mas runtime atual usa Postgres direto via `pg` | P0 | Substituir por `pg`/camada Postgres real; remover pseudo-codigo comentado |
| `app/src/components/app-shell/home/HomeApp.tsx:22` | Dados mockados | Comentario `dados mock` | Home do app analitico pode exibir dados nao reais como produto | P1 | Conectar a API/banco ou marcar explicitamente como demonstracao interna |
| `app/src/components/projetos/ProjetosSearchForm.tsx:124` | Falso positivo textual | Texto `TODOS` | Nao e mock/TODO; apenas label/chip | P4 | Nenhuma acao |

## Links Inativos

| Arquivo:linha | Elemento | Problema | Impacto | Severidade | Acao recomendada |
|---|---|---|---|---|---|
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:168` | `<a href="#">` | Link sem destino real | Usuario clica e permanece na mesma pagina; passa impressao de feature quebrada | P1 | Trocar por rota real, botao com `onClick`, ou remover ate a feature existir |
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:329` | `<a href="#">` | Link sem destino real | Mesmo impacto: navegacao falsa em pagina de candidato | P1 | Definir destino ou desabilitar visualmente sem anchor |

## Botoes Sem Acao Real Ou Com Acao Ficticia

| Arquivo:linha | Elemento | Problema | Impacto | Severidade | Acao recomendada |
|---|---|---|---|---|---|
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:260` | Input/controle de chat `disabled` | Chat/pergunta sobre candidato aparece como interface, mas esta desabilitado | Promete IA/interacao nao entregue | P2 | Ocultar ate implementar ou mostrar estado "recurso indisponivel" com justificativa |
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:269` | `<button disabled>` | Botao do chat desabilitado | Mesmo fluxo de chat sem acao | P2 | Implementar fluxo ou remover CTA |
| `app/src/components/painel/AlertasList.tsx:46` | Botao `+ NOVO` | Botao nao possui `onClick` | Usuario espera criar alerta, mas nada acontece | P1 | Implementar modal/form de alerta ou remover botao |
| `app/src/app/(site)/estado/[sigla]/assembleia/[slug]/page.tsx:317` | `<button className="dep-action">` | Botao sem `onClick` identificado na varredura | CTA pode parecer acionavel sem executar acao | P2 | Confirmar se e apenas estilo; se for acao, adicionar handler/Link |
| `app/src/components/politico-v2/PerfilApp.tsx:471` | Botao estilizado | Botao sem `onClick` identificado na varredura | CTA no perfil app pode ser falso | P2 | Converter para `Link`, adicionar handler ou remover cursor pointer |
| `app/src/components/politico-v2/PerfilSite.tsx:200` | Botao estilizado | Botao sem `onClick` identificado na varredura | CTA visual sem acao clara | P2 | Converter para `Link`, adicionar handler ou trocar por elemento informativo |
| `app/src/components/politico-v2/PoliticoDashboardV2.tsx:89` | `Button` sem handler identificado | Possivel CTA visual sem acao local | Pode ser apenas composicao com Link externo; precisa confirmar | P3 | Validar componente pai; documentar destino |
| `app/src/components/politico-v2/PoliticoDashboardV2.tsx:93` | `Button` sem handler identificado | Possivel CTA visual sem acao local | Idem | P3 | Validar componente pai; documentar destino |
| `app/src/components/politico-v2/PoliticoDashboardV2.tsx:100` | `Button` sem handler identificado | Possivel CTA visual sem acao local | Idem | P3 | Validar componente pai; documentar destino |

## Estados "Em Breve" E Promessas Incompletas

| Arquivo:linha | Texto/area | Feature prometida | Impacto | Severidade | Acao recomendada |
|---|---|---|---|---|---|
| `app/src/components/painel/FeedCivico.tsx:108` | `Esta área está em breve.` | Abas `Meus políticos`, `Alertas`, `Agenda`, `RSS / Export` | Abas navegaveis mostram bloco vazio | P2 | Ocultar abas fora do MVP ou implementar conteudo real |
| `app/src/components/painel/FeedCivico.tsx:53` | `Alertas (3)` | Contagem fixa de alertas | Diverge do painel que passa `alertasAtivos={0}` | P2 | Calcular contagem real ou remover numero |
| `app/src/components/politico-v2/PerfilApp.tsx:450` | `Comissões — em breve` | Comissoes do politico | Perfil app incompleto | P2 | Integrar dados de comissoes ou ocultar aba |
| `app/src/components/politico-v2/PerfilApp.tsx:555` | `sub="em breve"` | Secao nao identificada pelo inventario amplo | Cartao/metricas sem conteudo | P2 | Nomear feature e backlog |
| `app/src/components/politico-v2/PerfilApp.tsx:561` | `sub="em breve"` | Secao nao identificada pelo inventario amplo | Cartao/metricas sem conteudo | P2 | Nomear feature e backlog |
| `app/src/components/politico-v2/ModoCidadao.tsx:256` | `Detalhamento das votações em breve` | Drill-down de votacoes | Perfil cidadao nao aprofunda voto | P2 | Conectar com `votacoes` ou linkar metodologia |
| `app/src/components/site/DeputadoEstadualTabs.tsx:138` | Votacoes ALE serao integradas | Votacoes estaduais | Aba existe antes da coleta | P2 | Condicionar aba a dados reais |
| `app/src/components/site/DeputadoEstadualTabs.tsx:182` | Dados serao integrados em breve | Dados estaduais | Conteudo ausente | P2 | Integrar ETL ou ocultar |
| `app/src/components/site/DeputadoEstadualTabs.tsx:321` | Candidaturas anteriores em breve | Historico TSE | Promessa de sprint futuro | P3 | Mover para roadmap ou retirar da UI |
| `app/src/components/site/DeputadoEstadualTabs.tsx:347` | Declaracao de bens sera integrada | Bens 2022 | Dados ausentes | P3 | Integrar ou remover texto |
| `app/src/components/site/FontesContent.tsx:144` | `Fontes em breve (Fase 2)` | Catalogo de fontes | Pagina de fontes incompleta | P2 | Completar fontes ou trocar por conteudo atual |
| `app/src/app/(site)/estado/page.tsx:184` | `Mapa interativo · em breve` | Mapa interativo de estados | Hub de estados promete interatividade ausente | P2 | Implementar mapa ou remover CTA |
| `app/src/app/(site)/estado/[sigla]/assembleia/[slug]/page.tsx:604` | Emendas estaduais em breve | Emendas de deputados estaduais | Perfil estadual incompleto | P2 | Integrar fonte de emendas estaduais |
| `app/src/app/(site)/partidos/[sigla]/PartidoDetailClient.tsx:604` | Dados de coesao disponiveis em breve | Coesao partidaria | Analise partidaria incompleta | P2 | Conectar votacoes nominais e calcular score |
| `app/src/app/(site)/projetos/[slug]/page.tsx:371` | Historico detalhado disponivel em breve | Historico completo de projeto | Detalhe de projeto fica parcial | P2 | Conectar `proposicao_tramitacoes` completo |
| `app/src/app/api/admin/etl/run/route.ts:53` | `Trigger manual via SSH em breve` | Execucao ETL pelo admin | Backoffice promete acao operacional que nao executa | P1 | Implementar orquestracao ou renomear como "registrar solicitacao" |

## Placeholders Visuais E Layouts Parcialmente Ficticios

| Arquivo:linha | Tipo | Descricao | Impacto | Severidade | Acao recomendada |
|---|---|---|---|---|---|
| `app/src/components/site/DeputadoEstadualTabs.tsx:255` | Comentario placeholder | `Alinhamento partidário — placeholder` | Analise estadual sem dado real | P2 | Implementar calculo ou remover bloco |
| `app/src/components/site/DeputadoEstadualTabs.tsx:312` | Comentario placeholder | `Eleições anteriores — placeholder` | Historico eleitoral incompleto | P3 | Integrar TSE ou ocultar |
| `app/src/app/(site)/apoio/page.tsx:439` | Comentario placeholder | `PIX placeholder` | Pagamento PIX pode parecer disponivel mas incompleto | P1/P2 | Confirmar InfinitePay PIX ou remover representacao |
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:255` | Comentario placeholder | `Chat input placeholder` | Promessa de chat IA nao entregue | P2 | Remover/ocultar ate implementar |
| `app/src/app/(site)/estado/page.tsx:150` | Comentario placeholder | `decorative SVG map placeholder` | Mapa decorativo, nao interativo | P3 | Tornar mapa navegavel ou declarar como ilustracao |
| `app/src/app/(site)/estado/[sigla]/assembleia/[slug]/page.tsx:392` | Comentario placeholder | `Dots SIM / NÃO / ABS — placeholder ratio` | Visualizacao de votacao pode ser inventada/estatica | P2 | Calcular ratio a partir de votos reais |
| `app/src/app/(site)/glossario/[slug]/page.tsx:329` | Comentario placeholder | `Contexto Legal — placeholder estático` | Verbete juridico incompleto | P3 | Gerar contexto real ou ocultar bloco |
| `app/src/app/(site)/partidos/PartidosClient.tsx:419` | Comentario placeholder | Cards por padrao + placeholder | Pode ser apenas estrategia de grid; validar | P3 | Garantir que placeholders nao parecam partido real |
| `app/src/app/(site)/partidos/[sigla]/PartidoDetailClient.tsx:644` | Comentario placeholder | `Mapa de calor (placeholder)` | Heatmap partidario nao real | P2 | Conectar dados reais ou remover |
| `app/src/app/(site)/partidos/[sigla]/PartidoDetailClient.tsx:655` | Comentario placeholder | `Mapa placeholder` | Mesmo bloco de heatmap | P2 | Conectar dados reais ou remover |

## Dados Estaticos Com Aparencia Operacional

| Arquivo:linha | Dado | Problema | Impacto | Severidade | Acao recomendada |
|---|---|---|---|---|---|
| `app/src/components/painel/AlertasList.tsx:10` | `const INICIAIS` | Lista fixa de alertas | Usuario altera estado local, mas nada persiste | P2 | Persistir alertas por usuario ou rotular como demo |
| `app/src/components/painel/AlertasList.tsx:46` | `+ NOVO` | Botao sem acao | Cria promessa de configuracao de alerta | P1 | Implementar criacao de alerta |
| `app/src/components/painel/ProximasVotacoes.tsx:11` | `const BASE` | Votacoes futuras fake/estaticas | Pode informar agenda falsa | P1 | Conectar agenda real ou remover componente |
| `app/src/components/painel/ProximasVotacoes.tsx:17` | `rotuloData: '16.MAI 10h'` | Data textual fixa | Data pode ficar incoerente com dia atual | P1 | Calcular label real ou usar dados de origem |
| `app/src/components/painel/ProximasVotacoes.tsx:23` | `rotuloData: '17.MAI 14h'` | Data textual fixa | Mesmo risco | P1 | Calcular label real ou usar dados de origem |

## Candidato 2026: Debito Concentrado

| Arquivo:linha | Problema | Severidade |
|---|---|---|
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:168` | Link `href="#"` | P1 |
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:255` | Chat input placeholder | P2 |
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:259` | Placeholder de pergunta | P3/P4 se for input normal; P2 pelo chat nao implementado |
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:260` | Input/controle disabled | P2 |
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:269` | Botao disabled | P2 |
| `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:329` | Link `href="#"` | P1 |

Acao recomendada: separar o que e dado eleitoral oficial ja disponivel do que e produto futuro. Ocultar chat/links ate existir fluxo real.

## Placeholders Aceitaveis De Formulario

Os seguintes itens foram encontrados, mas nao sao debito visual por si so. Devem permanecer fora do backlog salvo problema de UX especifico:

| Arquivo:linha | Placeholder |
|---|---|
| `app/src/components/admin/PoliticoEditorSection.tsx:76` | Buscar por nome |
| `app/src/components/admin/MatchEmendaButton.tsx:127` | Nome do politico |
| `app/src/components/projetos/ProjetosSearchForm.tsx:90` | Exemplo de busca |
| `app/src/components/busca/BuscaClient.tsx:135` | Nome do parlamentar |
| `app/src/components/comparar/CompararClient.tsx:246` | Adicionar parlamentar |
| `app/src/components/auth/*.tsx` | Nome, email, senha |
| `app/src/app/(app)/proposicoes/page.tsx:217` | Buscar na ementa |
| `app/src/app/(admin)/admin/usuarios/page.tsx:120` | Filtrar por email |
| `app/src/app/(site)/glossario/page.tsx:125` | Buscar termo |
| `app/src/app/(site)/partidos/PartidosClient.tsx:499` | Buscar partido |
| `app/src/app/(site)/partidos/[sigla]/PartidoDetailClient.tsx:919` | Filtrar por nome ou estado |

## Priorizacao De Correcao

| Prioridade | Itens |
|---|---|
| P0 imediato | Persistencia do webhook InfinitePay |
| P1 antes de beta publico | `href="#"`, ProximasVotacoes fake, `+ NOVO` alerta sem acao, ETL admin prometido como trigger |
| P2 antes de producao | Abas "em breve" do painel, comissoes, dados estaduais/vereadores, heatmaps, chat candidato |
| P3 polish | Contexto legal estatico, mapas decorativos, placeholders de grid |
| P4 manter | Placeholders de input |

## Conclusao

O debito visual esta concentrado em promessas de produto futuro expostas como UI navegavel. O core loop busca-perfil-acompanhamento-painel permanece identificavel, mas o produto deve reduzir superficie "em breve" antes de producao para nao parecer quebrado. O item mais grave nao e visual: e o TODO do webhook InfinitePay, que causa perda de dados financeiros.

