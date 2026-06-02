# meuspoliticos.com — Wireframes
> Documento vivo — atualizado em maio de 2026

---

## Status geral

| Tela | Status |
|---|---|
| Home v3 | ✅ aprovado — "O que está acontecendo agora" + insights |
| Perfil do político v3 | ✅ aprovado — resumo executivo, última atividade, redes, relacionados |
| Busca / resultados | ✅ aprovado |
| Quem me representa (CEP) | ✅ aprovado |
| Perfil do candidato 2026 | ✅ aprovado |
| Meus políticos (painel) | ✅ aprovado v2 — com sidebar desktop |
| Feed de atividades | ✅ aprovado v2 — com ícones visuais por tipo |
| Login / cadastro | ✅ aprovado |
| Sobre / Fontes / Apoie | ✅ aprovado |
| Transparência do projeto | ⬜ pendente |
| Termos / Privacidade / Cookies | ✅ aprovado |
| Metodologia / Disclaimer / Limitações | ✅ aprovado |
| Correção de dados | ✅ aprovado |
| Neutralidade | ✅ aprovado |
| Status da plataforma | ✅ aprovado |
| Como verificar os dados | ✅ aprovado |
| Glossário | ✅ aprovado |
| Atuação parlamentar (aba — fase 2) | ⬜ fase 2 |
| Na imprensa (seção — fase 2) | ⬜ fase 2 |
| Timeline política (seção — fase 2) | ⬜ fase 2 |
| Insights / rankings (fase 2) | ⬜ fase 2 |

---

## 1. Home `/`

### Objetivo
Primeira impressão. Comunicar escopo nacional (presidente ao vereador) e converter o visitante em buscador ou cadastrado.

### Dois caminhos de entrada
1. Busca por nome — para quem já sabe quem quer ver
2. Busca por CEP — para quem não sabe o nome mas quer ver seus representantes

### Seções (de cima para baixo)
1. **Nav** — logo + links Sobre/Fontes + botão Entrar
2. **Hero (navy)** — headline "Do presidente ao vereador", pills dos 7 cargos, campo de busca, campo de CEP
3. **Explorar por cargo** — grid 4×2 com ícone, nome e contagem de cada nível político
4. **Números da plataforma** — 4 stats: políticos mapeados, votações, gastos, municípios
5. **Últimas votações** — feed de votações recentes com tag de tema e casa (Câmara/Senado)
6. **Destaque da semana** — ranking misto de presença (mistura cargos com badge identificador)
7. **Footer** — texto institucional + links + botão Apoie

### Decisões de design aprovadas
- Hero em azul navy com texto branco — transmite seriedade institucional
- Pills dos cargos no hero — comunicam escopo completo antes de qualquer interação
- Badges coloridos por cargo (Dep. Federal, Senador, Gov.) — diferencia visualmente sem confundir
- "Em breve" no grid de cargos — honesto sobre o que existe, mostra que cresce
- Botão "Apoie o projeto" no footer — discreto, sempre presente

### Cores dos badges de cargo
| Cargo | Fundo | Texto |
|---|---|---|
| Dep. Federal | `#e8eefb` | `#1a2b5e` |
| Senador | `#e8f5ee` | `#085041` |
| Governador | `#fff0e8` | `#7a3000` |
| Prefeito | `#f0e8ff` | `#3c1489` |
| Dep. Estadual | `#fef9e8` | `#7a6000` |
| Vereador | `#fce8f0` | `#7a0040` |

---

## 2. Perfil do político `/politicos/[id]`

> ✅ Aprovado

### Objetivo
Tela mais importante do site. O usuário chega aqui pelo nome ou pelo CEP e precisa entender em segundos quem é o político e o que ele faz.

### Estrutura (de cima para baixo)
1. **Nav** — logo + botão "Voltar à busca"
2. **Hero (navy)** — avatar com iniciais, nome, pills (cargo, partido, estado, mandato), botões Acompanhar + Compartilhar
3. **Stats bar** — 4 números: presença %, gasto cota, votações registradas, custo total do mandato
4. **Banner custo total** — salário + cota + estrutura, com link para fonte
5. **Abas** — Votações (ativa) · Gastos · Presença · Emendas (em breve) · Histórico (em breve)
6. **Conteúdo da aba** — varia conforme aba selecionada

### Aba Votações
- Filtros por tema (chips): Todos, Economia, Social, Segurança, Educação, Votou Sim, Votou Não, Ausente
- Lista de votações: data · tag de tema · descrição simplificada · código do PL · badge de voto · link fonte
- Badges: ✔ Votou sim (verde) · ✖ Votou não (vermelho) · ⚪ Ausente (cinza)
- Nota de fonte no rodapé da lista

### Aba Gastos
- Dois cards: total gasto no ano (navy) + média comparativa dos deputados do estado
- Lista de categorias: ícone + nome + barra proporcional + valor
- Categorias: Passagens aéreas, Hospedagem, Combustível, Divulgação, Alimentação, Outros
- Nota de fonte

### Aba Presença
- Número grande central com % (cor verde se acima da média, âmbar se abaixo)
- Três comparativos: este deputado vs média da Câmara vs média do estado
- Gráfico de barras mensais com cor variando por desempenho (verde/âmbar/cinza para meses futuros)
- Nota de fonte

### Elemento diferencial: custo total do mandato
Inspirado no De Olho em Você — salário + cota parlamentar + estrutura de gabinete.
Número impactante, viral, fácil de compartilhar nas redes.

### Decisões de design aprovadas
- Hero em navy mantém consistência com a home
- Abas "Em breve" visíveis mas desabilitadas — comunica o roadmap sem frustrar
- Todo dado tem link para fonte oficial — princípio de rastreabilidade
- Comparativo com média do estado é mais relevante que média nacional para o cidadão
- Cores de presença: verde ≥ 80%, âmbar 60–79%, vermelho < 60%

---

## 3. Busca `/busca`

> ✅ Aprovado

### Objetivo
Mostrar resultados da busca por nome com filtros por cargo, partido e estado.

### Estrutura
1. **Nav** — logo + campo de busca inline (com valor atual e botão limpar)
2. **Faixa de filtros** — chips de cargo, estado e partido — combinações livres
3. **Header de resultados** — contagem + ordenação (Relevância / Presença / Gastos)
4. **Lista de resultados** — cards por político
5. **Paginação** — anterior / números / próximo

### Card de resultado
- Avatar com iniciais (cor varia por cargo)
- Nome completo
- Badge de cargo (cor por nível)
- Metadados: estado, partido, período do mandato
- Mini stats: presença % (verde/vermelho) · gasto do ano · votações registradas
- Para cargos sem dados ainda: mostra "Fase 2 — dados em breve"

### Filtros disponíveis
- Cargo: Todos · Dep. Federal · Senador · Governador · Prefeito · Dep. Estadual · Vereador
- Estado: Todos + siglas dos 27 estados
- Partido: Todos + lista de partidos

### Decisões de design aprovadas
- Campo de busca fica na nav durante a busca — o usuário pode refinar sem voltar à home
- Políticos de cargos sem dados aparecem nos resultados com badge "Fase 2 — em breve"
- Presença colorida (verde ≥ 80%, vermelho < 60%) mesmo na listagem
- Ordenação padrão por relevância (correspondência do nome), não alfabética

---

## 4. Quem me representa `/meu-estado`

> ✅ Aprovado

### Objetivo
Usuário digita CEP e vê todos os representantes organizados por nível político — do presidente ao vereador.

### Estrutura
1. **Nav** — logo + link "Home"
2. **Hero (navy)** — campo de CEP grande + aviso "seus dados não são armazenados" + barra com endereço encontrado
3. **Seções por nível** — cada nível tem badge colorido, título e cards de representantes
4. **Rodapé de fontes** — ViaCEP + API Câmara

### Organização dos níveis (de cima para baixo)
| Nível | Badge | Conteúdo |
|---|---|---|
| Federal | Azul navy | Presidente |
| Estadual | Verde | Governador do estado |
| Federal | Azul navy | Senadores do estado (3) |
| Federal | Azul navy | Deputados federais do estado (até 70) — colapsável |
| Municipal | Roxo | Prefeito + vereadores (Em breve) |

### Card de representante
- Avatar com foto ou iniciais (cor por cargo)
- Nome + cargo + partido
- Stat principal: presença % (colorida) ou período do mandato
- Seta de navegação → vai para o perfil completo

### Decisão importante — deputados estaduais
SP tem 70 deputados federais. Mostrar todos de uma vez seria exaustivo. Solução: mostrar os 3 primeiros + botão "Ver todos os 70 deputados de SP".

### "Em breve" para municípios
Prefeitura e câmara municipal aparecem como card vazio com badge "Em breve" — honesto com o usuário, mostra o roadmap.

### Aviso de privacidade
"Seus dados de localização não são armazenados" — essencial para confiança. O CEP é usado só para a consulta, não é salvo.

### Decisões de design aprovadas
- Endereço resolvido aparece na barra dentro do hero — confirmação visual de que o CEP foi entendido
- Badges coloridos por esfera (Federal navy · Estadual verde · Municipal roxo) — hierarquia visual clara
- Tudo clicável → vai para o perfil do político

---

## 4b. Perfil do candidato 2026 `/candidato/[id]`

> ✅ Aprovado

### Diferença do perfil de político em exercício
Tela distinta — candidato não tem histórico de mandato atual. Foco em proposta, histórico eleitoral e bens declarados.

### Estrutura
1. **Nav** — logo + "Candidatos 2026"
2. **Hero (navy)** — tag "ELEIÇÕES 2026 · OUTUBRO" em âmbar, foto/iniciais, nome completo, nome na urna, pills (cargo candidato, partido, estado), botões Acompanhar + Compartilhar
3. **Barra de status** — situação da candidatura (deferida/indeferida) + link direto para o TSE
4. **Abas** — Proposta · Histórico · Bens
5. **Nota de neutralidade** — sempre visível, em âmbar

### Aba Proposta
- Card com badge "IA" explicando que é resumo gerado automaticamente
- 5 tópicos principais extraídos da proposta oficial
- Cada tópico: número + título + descrição em linguagem simples
- Link para o PDF original no TSE

### Aba Histórico
- Lista de candidaturas anteriores: ano + cargo + partido + resultado (eleito/não eleito)

### Aba Bens
- Total de bens declarados ao TSE + link para documento completo

### Nota de neutralidade — obrigatória
Banner âmbar fixo no topo da aba Proposta:
"O resumo foi gerado por IA a partir da proposta oficial do TSE. A plataforma não avalia, ranqueia ou recomenda candidatos. Todos os dados são de fontes oficiais."

### Decisões de design aprovadas
- Tag "ELEIÇÕES 2026" em âmbar — diferencia visualmente do perfil de político em exercício
- Nome na urna exibido — é como o eleitor vai reconhecer nas urnas
- Badge "IA" no resumo — transparência sobre o que foi processado automaticamente
- PDF original sempre disponível — o eleitor pode checar a fonte completa
- Candidatos em ordem alfabética em todas as listagens — neutralidade absoluta

## 5. Meus Políticos `/meus-politicos`

> ✅ Aprovado

### Objetivo
Painel pessoal do usuário logado. Visão geral de todos os políticos que acompanha, resumo de atividades recentes e integração com candidatos 2026.

### Estrutura
1. **Nav** — logo + ícone busca + avatar do usuário
2. **Header da página** — título "Meus políticos" + botão Adicionar + subtítulo com contagem e horário de atualização
3. **Sumário** — 3 métricas do dia: votações hoje, gastos este mês, candidatos 2026 dos seus políticos
4. **Grid de políticos acompanhados** — cards 2×2 + card vazio "Adicionar"
5. **Banner Eleições 2026** — avisa quando há candidatos disputando vagas dos políticos acompanhados
6. **Feed de atividades recentes** — prévia das últimas 4 ações + link "Ver feed completo"

### Card do político acompanhado
- Avatar + nome + cargo/partido/estado + botão remover (×)
- Mini stats: presença % + gasto do ano
- Novidade mais recente (última ação do político)
- Para cargos sem dados ainda: "Fase 2 — dados em breve"

### Banner Eleições 2026
Aparece automaticamente quando algum político acompanhado tem concorrentes cadastrados no TSE para 2026. Não aparece se não houver candidatos relevantes. Leva para a tela de candidatos filtrada pelos cargos dos políticos acompanhados.

### Card vazio "Adicionar"
Sempre o último card do grid — convida o usuário a adicionar mais políticos. Abre a busca.

### Sumário — lógica dos 3 números
- "Votações hoje" — soma de votações de todos os políticos acompanhados no dia atual
- "Gastos este mês" — soma dos gastos de cota parlamentar do mês atual
- "Candidatos 2026" — quantos candidatos disputam os mesmos cargos dos políticos acompanhados

### Decisões de design aprovadas
- Avatar do usuário na nav — confirmação visual de que está logado
- Sumário do dia logo abaixo do header — responde "o que aconteceu hoje?" antes do usuário rolar
- Banner 2026 em navy/royal com tag âmbar — destaque sem ser intrusivo
- Feed preview com 4 itens + link para o feed completo — não sobrecarrega o painel

---

## 6. Feed de atividades `/feed`

> ✅ Aprovado

### Objetivo
Feed cronológico completo de todas as ações dos políticos acompanhados. Versão expandida do preview que aparece no painel.

### Estrutura
1. **Nav** — logo + avatar do usuário
2. **Header** — título + horário de atualização + filtros
3. **Corpo** — itens agrupados por data com divisores
4. **Carregar mais** — paginação lazy (não carrega tudo de uma vez)

### Filtros disponíveis
Chips horizontais com scroll: Tudo · Votações · Gastos · Ausências · Discursos · [nome de cada político acompanhado]

### Tipos de item no feed
| Tipo | Visual |
|---|---|
| Votação | Tag de tema + badge de voto (sim/não/ausente) + código PL + link fonte |
| Gasto | Card interno com categoria, descrição e valor |
| Ausência | Card vermelho com contador acumulado de faltas e % de presença atual |
| Discurso | Tag de tema + descrição + link fonte |

### Agrupamento por data
Divisor com data em texto antes de cada grupo: "Hoje — 12 mai 2026", "Ontem — 11 mai 2026", data completa para dias anteriores.

### Decisões de design aprovadas
- Filtro por nome do político — o usuário pode isolar um só
- Item de ausência tem card vermelho interno destacando o contexto (falta nº x do mês, % acumulada) — mais informativo que só mostrar "ausente"
- Gasto tem card interno com detalhes — sem precisar clicar em outra tela
- Link de fonte em todo item — rastreabilidade sempre presente
- Lazy loading — carrega 20 itens por vez, botão "Carregar mais" ao final

---

## 7. Login e Cadastro `/login` `/cadastro`

> ✅ Aprovado

### Objetivo

### Login
- Logo + hero navy com boas-vindas
- Botão "Continuar com Google" (OAuth)
- Divisor "ou com e-mail"
- Campos: e-mail + senha (com toggle mostrar/ocultar)
- Link "Esqueci minha senha"
- Botão Entrar
- Link para cadastro

### Cadastro
- Logo + hero navy
- Botão "Continuar com Google"
- Divisor "ou com e-mail"
- Campos: nome + e-mail + senha
- Checkbox de aceite dos termos
- Botão "Criar conta"
- Link para login
- Nota de privacidade: "Seus dados de localização nunca serão armazenados ou vendidos"

### Decisões de design aprovadas
- Google OAuth como opção principal — reduz atrito no cadastro
- Nota de privacidade no cadastro — reforça a credibilidade da plataforma
- Telas simétricas — mesma estrutura, fácil de navegar entre as duas

---

## 8. Páginas legais

> ⬜ Pendente — conteúdo a ser redigido por advogado, estrutura visual simples

### `/termos` — Termos de uso
Condições de uso da plataforma, direitos e obrigações do usuário.

### `/privacidade` — Política de privacidade
Dados coletados, finalidade, base legal (LGPD), direitos do titular, contato do DPO.
Ponto crítico: deixar claro que dados de localização (CEP) não são armazenados.

### `/cookies` — Política de cookies
Quais cookies são usados, finalidade de cada um, como desativar.

### `/metodologia` — Como funciona
Como os dados são coletados (APIs oficiais), como a IA processa as ementas, frequência de atualização, o que fazer se encontrar erro.
**Disclaimer obrigatório sobre IA:** "Os resumos gerados por inteligência artificial podem conter imprecisões. A fonte oficial sempre prevalece. Em caso de divergência, consulte o documento original na Câmara dos Deputados ou no TSE."

### `/disclaimer` — Aviso legal
- A plataforma exibe dados públicos conforme a LAI (Lei nº 12.527/2011)
- A plataforma não é responsável por decisões tomadas com base nos dados
- A plataforma não tem vínculo com partidos, candidatos ou governos
- Os dados de políticos são públicos por lei — não há violação de privacidade
- Erros ou desatualizações podem ocorrer — sempre verificar a fonte oficial

### Decisão de design
Páginas legais têm layout editorial simples — sem nav complexa, sem elementos visuais pesados. Fundo branco, tipografia Inter, títulos em navy, texto em cinza. Link no footer de todas as páginas.

---

## 9. Correção de dados `/correcao`

> ⬜ Pendente

### Objetivo
Qualquer pessoa — cidadão, político ou candidato — pode solicitar correção de dados exibidos na plataforma.

### Formulário
- Nome (opcional)
- E-mail para retorno (opcional)
- Político ou candidato afetado (campo de busca)
- Qual dado está incorreto
- Qual deveria ser o dado correto
- Link da fonte oficial comprobatória (obrigatório)

### Regra crítica — exibida na página
"Dados de APIs oficiais não são corrigidos aqui — o erro está na fonte. Corrigimos apenas resumos gerados por IA ou erros de processamento interno."

---

## 10. Mobile first e PWA

> Decisão global de projeto

### Breakpoints
- Mobile 375–430px — layout principal, prioridade máxima
- Tablet 768px — grids expandem
- Desktop 1024px+ — layout completo

### Regras mobile obrigatórias
- Fonte mínima 12px · Toque mínimo 44×44px
- Scroll vertical apenas (chips de filtro exceção)
- Campos de formulário font-size 16px (evita zoom iOS)
- Cards em coluna única no mobile

### PWA — configurado no lançamento
Ícone na tela inicial, abertura em tela cheia, shell offline.
Next.js suporta via `next-pwa`.

### Push notifications — fase 2
Web Push API + OneSignal ou Firebase Cloud Messaging.
Notificações: votação do seu político · novo gasto · mudança de partido · candidato 2026 registrado.
MVP: sem push — usuário vê novidades ao abrir o app.
Infraestrutura PWA já preparada para ativar na fase 2 sem refatoração.

*meuspoliticos.com · wireframes em construção*

| /admin — Painel de administração | ✅ aprovado |
