---
file: docs/BUSINESS_DOMAIN.md
module: Business Domain
status: Active
related: [docs/DATABASE.md, docs/INVENTORY_DATABASE_USAGE.md, docs/MVP_REAL_IDENTIFICADO.md, docs/INVENTORY_FEATURES.md, docs/API.md]
---

# Business Domain

Data da consolidacao: 2026-06-02.

Este documento descreve o modelo conceitual do dominio de transparencia politica implementado no repositorio. Ele separa o que o produto promete, quais entidades existem no schema/codigo e quais jornadas de usuario foram identificadas como reais.

## Missao Do Produto

O Meus Politicos e uma plataforma de transparencia politica brasileira que organiza dados publicos oficiais sobre representantes, candidatos, partidos, votacoes, gastos, emendas, proposicoes, estados e municipios. A proposta de valor e reduzir friccao informacional sem editorializar o resultado.

Principios operacionais:

| Principio | Regra no dominio |
|---|---|
| Neutralidade politica | Nao recomendar, endossar ou ranquear moralmente candidatos, partidos ou ideologias |
| Rastreabilidade | Todo dado factual deve ter fonte oficial ou status de dado incompleto |
| Linguagem cidada | Conteudos tecnicos devem ser simplificados sem alterar significado |
| IA como facilitador | Resumos IA devem ser rotulados e cacheados |
| Dados pessoais minimos | CEP nao deve ser persistido; CPF deve ficar restrito ao ETL quando usado como ancora |
| Codigo vence documentacao | Divergencias antigas viram gaps |

## Usuarios E Atores

| Ator | Objetivo | Entidades principais | Status no codigo |
|---|---|---|---|
| Cidadao anonimo | Buscar representantes e entender atuacao | `politicos`, `partidos`, `votacoes`, `gastos`, `presenca`, `emendas`, `proposicoes`, `glossario` | Implementado parcialmente |
| Usuario autenticado | Acompanhar politicos e ver feed civico | `perfis`, `acompanhamentos`, `politicos`, `votacoes`, `gastos` | Core loop implementado |
| Admin | Monitorar dados, flags, usuarios e solicitacoes ETL | `perfis`, `feature_flags`, `admin_logs`, `coletas_log`, `analytics_eventos` | Parcial |
| Operador ETL | Coletar e reconciliar dados oficiais | `coletas_log`, tabelas de dominio e scripts `etl/*` | Scripts existem, orquestracao parcial |
| Apoiador financeiro | Fazer apoio/doacao | InfinitePay, futura `doacoes` | Link real; persistencia ausente |
| Sistema externo | Enviar webhook/retorno | `/api/webhooks/infinitepay`, Logto callback | Parcial/nao validado |

## Entidades Nucleares

### Politico

Tabela: `politicos`.

Entidade central do dominio. Representa ocupantes ou candidatos conectados a cargos publicos, com identificadores de multiplas fontes.

Campos conceituais:

| Grupo | Exemplos |
|---|---|
| Identidade publica | `nome`, `nome_civil`, `nome_eleitoral`, `slug`, `foto_url` |
| Mandato | `cargo`, `uf`, `situacao`, `mandato_inicio`, `mandato_fim` |
| Partido atual | `partido_id` |
| Fonte externa | `id_camara`, `id_senado`, `id_tse`, `id_ale`, `codigo_siafi` |
| Agregados de UI | `presenca_pct_atual`, `gasto_total_ano`, `total_votacoes`, totais de emendas |
| Qualidade do dado | `dado_estado`, `source_id`, `source_record_id`, `collected_at`, `removido_em` |

Relacionamentos:

| Relacao | Tipo | Tabelas |
|---|---|---|
| Partido atual | N:1 | `politicos.partido_id -> partidos.id` |
| Votacoes | 1:N | `votacoes.politico_id` |
| Gastos | 1:N | `gastos.politico_id` |
| Presenca | 1:N | `presenca.politico_id` |
| Emendas | 1:N | `emendas.politico_id` |
| Seguidores | N:M | `acompanhamentos` |
| Candidatura | 1:N / 1:1 contextual | `candidatos.politico_id` |
| Proposicoes autoradas | N:M soft | `proposicao_autores.politico_id` |

### Partido

Tabela: `partidos`.

Representa partido politico e metadados de exibicao. O codigo tambem consulta `partidos_fundos`, mas essa tabela nao foi encontrada nas migrations; ela e criada dinamicamente por `etl/partidos/collect_fundos_tse.py`.

| Uso | Evidencia |
|---|---|
| Busca de politicos | `/api/busca` |
| Perfil de politico | `politicos/[id]/page.tsx` |
| Pagina de partidos | `(site)/partidos/page.tsx` |
| Detalhe de partido | `(site)/partidos/[sigla]/page.tsx` |
| ETL | `collect_deputados.py`, `collect_senadores.py`, `collect_candidatos_2026.py` |

### Votacao

Tabela: `votacoes`.

Registra voto nominal ou evento de voto associado a politico. E uma das bases mais usadas pelo produto.

| Jornada | Uso |
|---|---|
| Home publica | Votacoes recentes agrupadas por `proposicao_id` |
| Perfil | Historico recente de votos |
| Painel | Feed civico dos politicos acompanhados |
| Partidos | Coesao e maioria por proposicao |
| Projetos | Votacoes associadas a proposicao |
| ETL | Camara, Senado, ALEs |

### Gasto

Tabela: `gastos`.

Representa despesas parlamentares/CEAP/CEAPS e gastos coletados de fontes legislativas.

| Jornada | Uso |
|---|---|
| Perfil | Gastos do ano atual por politico |
| Painel | Eventos de gasto dos politicos seguidos |
| Camara | Agregados e destaques |
| Partido | Gasto agregado por partido |
| ETL | Camara, Senado, ALEs |

### Presenca

Tabela: `presenca`.

Representa presenca parlamentar por periodo. E consultada no perfil de politico, mas parte da cobertura parece depender de ETL pendente ou agregacoes ALE.

### Emenda

Tabela: `emendas`.

Representa emendas parlamentares, valores, municipio/UF destino, area/funcao e vinculo com politico. Tem uso em perfil, estado, admin de dados, match manual e ETL Portal da Transparencia.

### Proposicao

Tabelas: `proposicoes`, `proposicao_autores`, `proposicao_tramitacoes`.

Modela projetos de lei, PECs, PLPs, MPs e historico de tramitacao. O produto expõe essas entidades em `/projetos`, `/projetos/[slug]`, `/proposicoes` e `/proposicoes/[slug]`.

### Candidato 2026

Tabela: `candidatos`.

Representa candidatos eleitorais coletados do TSE. O codigo tenta consultar `candidatos_bens`, mas essa tabela nao foi encontrada no schema versionado. Portanto, bens patrimoniais sao uma dependência nao garantida.

### Usuario/Perfil

Tabelas: `perfis`, `acompanhamentos`.

O runtime atual usa Logto para identidade externa e `perfis` para identidade interna/RBAC. `acompanhamentos` conecta usuario a politico.

| Conceito | Implementacao |
|---|---|
| Identidade externa | Logto (`logto_sub`) |
| Perfil interno | `perfis.id` |
| Role admin | `perfis.role` |
| Compat legado | `perfis.supabase_user_id`, consulta a `auth.users` |
| Seguir politico | `acompanhamentos(usuario_id, politico_id)` |

### Admin E Operacao

Tabelas: `feature_flags`, `admin_logs`, `analytics_eventos`, `coletas_log`.

| Entidade | Papel |
|---|---|
| `feature_flags` | Liga/desliga features e rollout |
| `admin_logs` | Auditoria de acoes admin |
| `analytics_eventos` | Eventos de uso capturados por `/api/analytics` |
| `coletas_log` | Status de ETLs |

### IA E Glossario

Tabelas: `glossario`, `politico_resumos_ia`, `politico_resumos_ia_cotas`.

| Entidade | Papel |
|---|---|
| `glossario` | Definicoes simples/tecnicas e termos relacionados |
| `politico_resumos_ia` | Cache de resumo interpretativo |
| `politico_resumos_ia_cotas` | Limite diario de geracao |

## Jornadas Criticas Do Usuario

### Jornada 1: Descobrir e buscar politicos

1. Usuario acessa `/`.
2. Home exibe votacoes recentes.
3. Usuario navega para `/busca`.
4. `BuscaClient` chama `/api/busca`.
5. API consulta `politicos` e `partidos`.
6. Usuario abre `/politicos/[id]`.

Entidades: `politicos`, `partidos`, `votacoes`, `gastos`, `presenca`, `emendas`.

Status: implementada em codigo; runtime de banco nao validado nesta auditoria.

### Jornada 2: Acompanhar politico

1. Usuario clica em acompanhar no perfil.
2. Se nao autenticado, vai para Logto via `/api/auth/logto/sign-in`.
3. `getCurrentUser()` reconcilia Logto com `perfis`.
4. `POST /api/acompanhamentos` grava o vinculo.
5. `/painel` le `acompanhamentos`.

Entidades: `perfis`, `acompanhamentos`, `politicos`.

Status: core MVP implementado.

### Jornada 3: Feed civico

1. Usuario autenticado acessa `/painel`.
2. Painel carrega seguidos.
3. Consulta `votacoes` e `gastos` dos ultimos 7 dias.
4. Monta `FeedEvento`.

Entidades: `perfis`, `acompanhamentos`, `politicos`, `partidos`, `votacoes`, `gastos`.

Status: parcial; alertas e proximas votacoes ainda usam dados estaticos/placeholders.

### Jornada 4: Investigar partido

1. Usuario acessa `/partidos`.
2. Lista partidos, membros e fundos.
3. Usuario abre `/partidos/[sigla]`.
4. Produto consulta membros, gastos, coesao e votos.

Entidades: `partidos`, `politicos`, `gastos`, `votacoes`, `partidos_fundos`.

Status: parcial; `partidos_fundos` nao esta em migration versionada.

### Jornada 5: Investigar projeto/proposicao

1. Usuario acessa `/projetos` ou `/proposicoes`.
2. Lista proposicoes.
3. Abre detalhe.
4. Ve autores, tramitacao e votacoes relacionadas.

Entidades: `proposicoes`, `proposicao_autores`, `proposicao_tramitacoes`, `votacoes`, `politicos`, `partidos`.

Status: parcial; historico detalhado ainda aparece como "em breve" em UI.

### Jornada 6: Estado e municipio

1. Usuario acessa `/estado` ou `/meu-estado`.
2. Seleciona UF/cidade ou informa CEP.
3. Produto apresenta governador, bancada, economia, municipios, emendas e ALE.

Entidades: `estados_governos`, `estados_economia`, `estados_pacto_federativo`, `estados_tribunais`, `estados_timeline`, `estados_ale`, `municipios`, `emendas`, `politicos`, `partidos`.

Status: parcial; deputados estaduais, vereadores e emendas estaduais ainda têm lacunas visuais/dados.

### Jornada 7: Apoiar financeiramente

1. Usuario acessa `/apoio`.
2. Frontend chama `/api/apoio/criar-link`.
3. Backend cria link InfinitePay.
4. InfinitePay chama `/api/webhooks/infinitepay`.

Entidades esperadas: futura `doacoes`.

Status: incompleto. Link e real, mas webhook nao persiste; `doacoes` nao foi identificada no schema versionado.

### Jornada 8: Admin operacional

1. Admin acessa `/admin`.
2. Ve contagens, usuarios, flags, analytics, dados e ETL.
3. Atualiza flags/politicos/emendas.
4. Registra logs em `admin_logs`.

Entidades: `perfis`, `feature_flags`, `admin_logs`, `analytics_eventos`, `coletas_log`, `politicos`, `emendas`.

Status: parcial; ETL run nao executa scripts Python, apenas registra solicitacao.

## Artefatos Extras TXT/CSV Integrados

Esta consolidacao incorporou os arquivos `.txt` e `.csv` avulsos encontrados no repositorio seguindo a hierarquia v4.0: schema/codigo em producao permanece fonte primaria; artefatos de wireframe e texto temporario entram como evidencia historica de produto, nao como contrato operacional.

| Artefato | Conteudo Util Incorporado | Classificacao |
|---|---|---|
| `docs/stitch_wireframes_match.csv` | Matriz de correspondencia entre wireframes e rotas existentes/faltantes. Confirma como requisitos historicos os fluxos de busca, perfil politico, comparacao, proposicoes, painel civico pessoal, fontes, glossario, estado, candidatos 2026 e paginas institucionais. Tambem registra lacunas de rotas para FAQ, sustentabilidade, portais de transparencia legislativa/municipal e suite de inteligencia. | Referencia historica de produto/design. |
| `app/temp_analysis.txt` | Evidencia textual/HTML de wireframe "App / Painel civico pessoal (logado)", reforcando que o painel autenticado deve centralizar acompanhamento civico pessoal. | Export temporario; nao e documento canonico. |
| `app/temp_text_only.txt` | Variante textual do mesmo painel civico pessoal logado, sem regra adicional de dominio alem do requisito de dashboard autenticado. | Export temporario; nao e documento canonico. |
| `app/temp_structure.txt` | Variante estrutural/HTML do painel civico pessoal logado, incluindo markup e payload visual sem funcao operacional no app. | Export temporario; nao e documento canonico. |
| `app/temp_clean_text.txt` | Variante limpa do mesmo material de painel civico pessoal, util apenas para rastreabilidade historica do requisito. | Export temporario; nao e documento canonico. |

Requisitos de negocio herdados desses artefatos:

- O painel civico pessoal logado e uma jornada nuclear de usuario autenticado, conectando acompanhamento de politicos, alertas, feed civico e possivel priorizacao por interesses.
- A suite de inteligencia aparece como ambicao de produto posterior ao MVP real: busca avancada, terminal de inteligencia, dossie, matriz de confronto, monitoramento de alertas e home analitica nao devem ser tratadas como prontas.
- Portais de transparencia por orgao legislativo e municipio representam verticais futuras, nao superficie atual validada de producao.
- A matriz historica indica divergencia em partido/modulo de partidos; como o inventario atual ja mapeia rotas de partidos, esse ponto deve ser tratado como drift documental, nao como ausencia confirmada.
- FAQ e sustentabilidade aparecem como paginas esperadas sem rota consolidada; entram como pendencia de experiencia/institucional, nao como bloqueio do core loop.

## Regras De Negocio E Invariantes

| Regra | Implementacao/risco |
|---|---|
| Politico deve ter `slug` unico | Usado em rotas publicas |
| Candidato pode ou nao estar vinculado a politico | `candidatos.politico_id` nullable |
| Acompanhamento exige perfil interno | `currentUser.perfilId` usado em APIs |
| Duplicidade de acompanhamento nao deve falhar para usuario | `23505` retorna `{ ok: true }` |
| ETLs devem ser idempotentes | Scripts usam `ON CONFLICT ... DO UPDATE` em varias cargas |
| Pagamento deve ser idempotente | Ainda nao implementado; usar `order_nsu` |
| Dados IA devem ser cacheados/cotados | `politico_resumos_ia*` |
| Dado sem fonte/sem cobertura deve ser rotulado | Nem todas as telas fazem essa distincao |

## Divergencias De Dominio

| Divergencia | Estado real |
|---|---|
| Supabase Auth vs Logto | Logto e runtime atual; `auth.users` ainda e fallback legado |
| Stripe vs InfinitePay | InfinitePay e fluxo ativo; Stripe e historico |
| `doacoes` | Necessaria para dominio financeiro, nao identificada no schema versionado |
| `partidos_fundos` | Consultada pelo app e criada por ETL, mas ausente das migrations |
| `candidatos_bens` | Consultada com catch de ausencia, mas ausente das migrations |
| Scores/rankings amplos | Parcial; nao devem ser promessa publica plena |

## Conclusao

O dominio implementado ja sustenta um MVP de transparencia politica baseado em busca, perfil, acompanhamento e feed civico. As principais fragilidades conceituais sao a ausencia de persistencia financeira (`doacoes`), uso de tabelas fora do schema versionado (`partidos_fundos`, `candidatos_bens`) e funcionalidades de painel que parecem operacionais mas ainda usam dados estaticos.
