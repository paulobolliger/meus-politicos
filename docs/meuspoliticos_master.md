# meuspoliticos.com — Master Doc
> "Transparência para decidir melhor."
> Status: **pré-lançamento** · Meta: **live em 15 dias**
> Documento vivo — atualizado em maio de 2026

---

## 1. O que é

Portal de transparência política para o cidadão brasileiro.
Sem narrativa. Sem opinião. Só dados verificáveis, de fontes oficiais, apresentados de forma simples.

**Do presidente ao vereador — tudo em um só lugar.**

O cidadão pesquisa qualquer político e vê, em segundos:
- O que votou
- Como gastou dinheiro público
- Com que frequência compareceu
- Quem financia sua campanha

**Posicionamento:** "O Google da política brasileira."

A plataforma não editorializa, não milita, não opina. Mostra dados. O usuário conclui sozinho. Neutralidade não é fraqueza — é o produto.

---

## 1b. Como funciona — texto base para a página /sobre

> *Este texto serve de base para a página /sobre e conteúdos de marketing. Tom: direto, acessível, sem jargão técnico.*

---

### O problema que resolvemos

A política brasileira afeta cada aspecto da sua vida — da saúde pública à educação dos seus filhos, do preço dos alimentos à segurança da sua rua. Mas acompanhar o que os políticos realmente fazem é difícil, fragmentado e, muitas vezes, manipulado por interesses editoriais.

As informações existem. Estão nos portais oficiais da Câmara, do Senado, do TSE e do Portal da Transparência. O problema é que estão espalhadas em dezenas de sistemas diferentes, em formatos técnicos inacessíveis para o cidadão comum.

O Meus Políticos resolve isso.

---

### O que fazemos

Coletamos dados diretamente das fontes oficiais do governo brasileiro e os apresentamos de forma simples, organizada e neutra — sem filtro editorial, sem agenda política.

**Nossas fontes:**
- **Câmara dos Deputados** — votações, gastos de gabinete, presenças, projetos de lei
- **Senado Federal** — votações, discursos, comissões
- **TSE** — histórico de candidaturas, bens declarados, financiamento de campanha
- **Portal da Transparência** — emendas parlamentares, viagens, contratos
- **IBGE** — dados geográficos para cruzar representantes com municípios
- **Diário Oficial da União** — nomeações, decretos, atos oficiais

---

### Como apresentamos os dados

**Linguagem simples:** ementas técnicas de projetos de lei são traduzidas automaticamente para português acessível. A versão original está sempre disponível para quem quiser verificar.

**Sem opinião:** os dados são apresentados como são. Não dizemos se uma votação foi boa ou ruim — mostramos como o político votou e deixamos você concluir.

**Contexto:** cada número vem acompanhado de comparativo — média do partido, média do estado, média nacional. Sem contexto, um número isolado não significa nada.

**Atualização contínua:** os dados são coletados automaticamente de forma regular. Votações novas, gastos novos e atos oficiais aparecem em horas.

---

### Quem me representa?

Digite seu CEP e descubra instantaneamente todos os seus representantes políticos — do vereador ao presidente. Veja o histórico de cada um e decida por si mesmo.

---

### Neutralidade como princípio

O Meus Políticos não tem filiação partidária, não recebe financiamento de partidos ou grupos políticos e não emite opinião sobre candidatos, partidos ou ideologias.

Acreditamos que cidadãos bem informados tomam melhores decisões. Nosso papel é dar informação — o resto é com você.

Qualquer erro nos dados pode ser reportado diretamente pela plataforma. Levamos correções a sério.

---

### Quem somos

O Meus Políticos é desenvolvido e operado pela **NORO GURU** (NORO Tecnologia e Turismo Ltda · CNPJ 63.429.497/0001-88), empresa brasileira com sede em Campinas/SP.

Contato: contato@meuspoliticos.com.br

---

### Domínios

| Domínio | Papel | Status |
|---|---|---|
| `meuspoliticos.com.br` | **Principal** — site, SEO, e-mails | ✅ Registrado (Hostgator → Cloudflare) |
| `meuspoliticos.com` | Alias — redireciona 301 para `.com.br` | ✅ Registrado (Hostgator → Cloudflare) |

**DNS:** Cloudflare (nameservers apontados pelo Hostgator)

| Domínio | Nameserver 1 | Nameserver 2 |
|---|---|---|
| `meuspoliticos.com` | `dom.ns.cloudflare.com` | `kim.ns.cloudflare.com` |
| `meuspoliticos.com.br` | `alfred.ns.cloudflare.com` | `treasure.ns.cloudflare.com` |

**Hosting:** Vercel — domínio personalizado `meuspoliticos.com.br`
**Redirect:** `meuspoliticos.com` → `meuspoliticos.com.br` via Cloudflare Redirect Rules (301 permanente)

### Auth — Google OAuth

| Campo | Valor |
|---|---|
| Provedor | Google Cloud Console |
| Project | meus-politicos-496222 |
| Client ID | `628132097975-t97ai1p9tnat7pfaubnj4c07oe4c3i1t.apps.googleusercontent.com` |
| Client Secret | **Ver Google Cloud Console** |
| Origens JS autorizadas | `https://meuspoliticos.com.br` · `http://localhost:3000` |
| URI de redirecionamento | `https://ldgfmrvaluwidpghafke.supabase.co/auth/v1/callback` |
| Configurado em | Supabase → Authentication → Providers → Google |

### Auth — X (Twitter) OAuth

| Campo | Valor |
|---|---|
| Provedor | X (Twitter) / console.x.com |
| Client ID | `QVZHU1lVWFY4ajFrVTN5TjZXZk46MTpjaQ` |
| Client Secret | **Ver .env.local** |
| Configurado em | Supabase → Authentication → Providers → Twitter |

### Google Search Console

| Campo | Valor |
|---|---|
| Domínio | `meuspoliticos.com.br` |
| Status | ✅ Registrado — dados em processamento (~1 dia) |
| Próximo passo | Submeter sitemap: `meuspoliticos.com.br/sitemap.xml` |

| Campo | Valor |
|---|---|
| Organização | Meus Politicos |
| Projeto | meus-politicos |
| Project ref | `ldgfmrvaluwidpghafke` |
| URL | `https://ldgfmrvaluwidpghafke.supabase.co` |
| DB host | `db.ldgfmrvaluwidpghafke.supabase.co` |
| Região | South America (São Paulo) — sa-east-1 |
| Database password | **Ver .env.local** — não armazenar aqui |
| Schema | `supabase/001_schema.sql` v2.11 |

**⚠️ Credenciais salvas em `.env.local` (não commitado) e no gerenciador de senhas.**

### E-mail institucional — Titan (Hostgator)

| Endereço | Uso |
|---|---|
| `contato@meuspoliticos.com.br` | Contato público / formulário do site |

**Provedor:** Titan (Hostgator) — webmail em `https://titan.hostgator.com.br/mail/`

**Configurações IMAP/SMTP:**
```
Incoming:  imap.titan.email  · porta 993 · SSL/TLS
Outgoing:  smtp.titan.email  · porta 465 · SSL/TLS
Username:  contato@meuspoliticos.com.br
```

### E-mail transacional — Resend

| Campo | Valor |
|---|---|
| Provedor | Resend |
| Domínio | `meuspoliticos.com.br` |
| Região | São Paulo (sa-east-1) |
| From | `noreply@meuspoliticos.com.br` |
| API Key | **Ver .env.local** |
| Plano | Free (3.000 e-mails/mês) |

**Registros DNS adicionados automaticamente via Resend → Cloudflare:**

| Tipo | Nome | Conteúdo |
|---|---|---|
| MX | `send` | `feedback-smtp.sa-east-1.amazonses.com` (prioridade 10) |
| TXT | `resend._domainkey` | DKIM Resend |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |

**`.env.local`:**
```
RESEND_API_KEY=re_Se4uTEFo_PANsmSN2pUjVX9Q8xxK4sZJ7
RESEND_FROM=noreply@meuspoliticos.com.br
```

### APIs externas

| API | Chave | Status | Fase |
|---|---|---|---|
| Portal da Transparência | **Ver .env.local** | ✅ Ativa | MVP |
| OpenAI | **Ver .env.local** | ✅ Ativa | MVP |
| Bing News Search | — | ⏳ Pendente | Fase 2 |
| NewsAPI | — | ⏳ Pendente | Fase 2 |
| SIOP | Requer cadastro específico | ⏳ Pendente | Fase 2 |

**Portal da Transparência — uso:**
```
Header: chave-api-dados: <ver .env.local>
Cadastro: portaldatransparencia.gov.br/api-de-dados/cadastrar-email
Login gov.br: paulobolliger@gmail.com
Rate limit: 400 req/min diurno · 700 req/min madrugada
```

### `.env.local` completo

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ldgfmrvaluwidpghafke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mcBDrVWxuicQoKoTGso5bA_flmy7n7M
SUPABASE_SERVICE_ROLE_KEY=              ← pegar em Supabase → Settings → API
SUPABASE_DB_HOST=db.ldgfmrvaluwidpghafke.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=                   ← ver gerenciador de senhas

# App
NEXT_PUBLIC_APP_URL=https://meuspoliticos.com.br

# E-mail transacional
RESEND_API_KEY=re_Se4uTEFo_PANsmSN2pUjVX9Q8xxK4sZJ7
RESEND_FROM=noreply@meuspoliticos.com.br

# APIs externas
PORTAL_TRANSPARENCIA_API_KEY=           ← ver gerenciador de senhas
OPENAI_API_KEY=                         ← ver gerenciador de senhas
```

| Campo | Valor |
|---|---|
| Razão Social | NORO TECNOLOGIA E TURISMO LTDA |
| Nome Fantasia | NORO GURU |
| CNPJ | 63.429.497/0001-88 |
| Porte | ME |
| Situação | Ativa desde 29/10/2025 |
| Endereço | R. Comendador Torlogo Dauntre, 74 — Sala 1207, Cambui, Campinas/SP — CEP 13.025-270 |
| E-mail corporativo | noro@noro.guru |
| CNAE principal | 62.01-5-01 — Desenvolvimento de programas de computador sob encomenda |

**O Meus Políticos é um produto da NORO GURU** — desenvolvido e operado pela empresa, com CNAE compatível com a atividade (desenvolvimento de software, portais de conteúdo e serviços de informação na internet).

---

## 3. Branding e identidade visual

### Logo
Símbolo que combina: "M" estilizado + barras de dados + linhas de monitoramento/conexão.
Três versões disponíveis: colorida (principal), app (ícone quadrado arredondado), monocromática.

Arquivos: `logo_meuspoliticos.png` · `branding_meus_politicos_manifesto_identidade.md`

### Tagline
**TRANSPARÊNCIA · DADOS · CIDADANIA**

### Slogan principal
**"Transparência para decidir melhor."**

### Paleta de cores
| Cor | Papel | Hex aproximado |
|---|---|---|
| Azul navy | Texto principal, hero, autoridade | `#1a2b5e` |
| Azul royal | CTAs, links, destaques | `#2952cc` |
| Azul royal claro | Fundos de badges, hover | `#e8eefb` |
| Preto | Sofisticação, textos fortes | `#000000` |
| Branco | Fundos, clareza | `#ffffff` |
| Cinza fundo | Background de páginas | `#f5f6fa` |
| Cinza borda | Separadores, bordas | `#e2e5ef` |
| Cinza texto | Textos secundários | `#6b7280` |

### Tipografia
Sans-serif geométrica moderna. Referências: **Inter** (preferida), Manrope, Sora, Plus Jakarta Sans, DM Sans.

### Personalidade da marca
Inteligente · Séria · Neutra · Credível · Moderna · Precisa · Institucional

### O que a marca NÃO é
Partidária · Militante · Agressiva · Sensacionalista · Emocional · Ideológica

### Ícones do sistema (já definidos no branding)
Transparência · Dados públicos · Cidadania · Confiança · Tecnologia · Prestação de contas

---

## 4. Diferencial competitivo

Principal concorrente identificado: **De Olho em Você** (deolhoemvoce.com.br)
Criado por uma advogada e um programador. Foco em emendas PIX, cota parlamentar e votações da Câmara.

| De Olho em Você | Meus Políticos |
|---|---|
| Só deputados federais | Todos os cargos — presidente ao vereador |
| Transparência passiva | Transparência ativa |
| Você vai lá quando quer | Te avisa quando importa |
| Dado bruto | Dado + contexto + IA (fase 2) |
| Sem conta de usuário | "Meus políticos" — personalizado |
| Portal de consulta | Plataforma de acompanhamento cidadão |

**Ideia boa deles que absorvemos:** "custo total do mandato" (salário + cota + estrutura) — número impactante e viral. Entra no perfil do político.

**O espaço que eles não ocuparam:** relacionamento contínuo entre eleitor e representante em todos os níveis. Eles fazem fiscalização de dados. Nós fazemos sistema operacional da cidadania política.

---

## 5. Stack técnica

| Camada | Tecnologia | Custo |
|---|---|---|
| Frontend | Next.js 15 + TypeScript | Grátis (Vercel) |
| Banco de dados | Supabase (PostgreSQL) | Grátis até 500MB |
| Autenticação | Supabase Auth | Grátis |
| Backend/API | Supabase Edge Functions | Grátis |
| Coleta de dados | Python scripts via GitHub Actions | Grátis |
| Deploy frontend | Vercel | Grátis |
| CI/CD | GitHub Actions | Grátis |
| E-mail transacional | Resend | Grátis até 3k/mês |
| Pagamentos/doações | Guru + Asaas (contrato existente) | Contrato ativo |

**Custo de infraestrutura no MVP: R$ 0/mês**

### Dependências instaladas (`app/`)

**UI e componentes:**
```
shadcn/ui (Tailwind v4)
  └── button, input, card, badge, avatar
  └── separator, skeleton, tabs, dialog, sheet
lucide-react       ← ícones
clsx + tailwind-merge ← utilitários de classes
```

**Supabase:**
```
@supabase/supabase-js  ← client principal
@supabase/ssr          ← SSR/Server Components
```

**Formulários e validação:**
```
react-hook-form
@hookform/resolvers
zod
```

**Utilitários:**
```
date-fns   ← formatação de datas
```

---

## 6. IAs no desenvolvimento

| IA | Papel |
|---|---|
| GitHub Copilot | Escrever código linha a linha |
| Claude | Arquitetura, lógica, revisão, documentação |
| OpenAI API | Tradução de juridiquês, resumos automáticos (fase 2) |
| Gemini | Pesquisa e validação de dados |

---

## 7. Escopo por nível político

| Cargo | Quantidade | Fonte | Fase |
|---|---|---|---|
| Presidente | 1 | TSE / dados públicos | 2 |
| Governadores | 27 | TSE CSV | 2 |
| Senadores | 81 | API Senado | 2 |
| Deputados federais | 513 | API Câmara | **MVP** |
| Deputados estaduais | ~1.000 | Assembleias (27) | 3 |
| Prefeitos | 5.570 | TSE CSV | 3 |
| Vereadores | ~57.000 | Câmaras municipais | 4 |

A home já comunica todos os níveis desde o dia 1 ("Do presidente ao vereador"), mas os dados chegam em fases conforme a disponibilidade das APIs.

---

## 8. Fontes de dados — mapeamento completo

### 8.1 Câmara dos Deputados ✅ MVP
**Base:** `https://dadosabertos.camara.leg.br/api/v2`
Sem autenticação · JSON · Qualidade excelente

| Endpoint | Dados | Fase |
|---|---|---|
| `/deputados` | Lista todos os 513 | MVP |
| `/deputados/{id}` | Perfil completo | MVP |
| `/deputados/{id}/votacoes` | Votações nominais | MVP |
| `/deputados/{id}/despesas` | Cota parlamentar | MVP |
| `/deputados/{id}/eventos` | Presença em sessões | MVP |
| `/votacoes/{id}` | Detalhes de votação | MVP |
| `/deputados/{id}/discursos` | Discursos | fase 2 |
| `/proposicoes` | Projetos de lei | fase 2 |

Fotos: `https://www.camara.leg.br/internet/deputado/bandep/{id}.jpg`

### 8.2 Senado Federal ✅ Fase 2
**Base:** `https://legis.senado.leg.br/dadosabertos`
Sem autenticação · Retorna XML por padrão (usar header `Accept: application/json`)

| Endpoint | Dados |
|---|---|
| `/senador/lista/atual` | Senadores atuais |
| `/senador/{id}` | Perfil |
| `/senador/{id}/votacoes` | Votações |
| `/senador/{id}/despesas` | Gastos |

### 8.3 Portal da Transparência ✅ Fase 2
**Base:** `https://portaldatransparencia.gov.br/api-de-dados`
API Key gratuita via gov.br (conta prata/ouro + 2FA)
Limite: 90 req/min (dia) · 700 req/min (madrugada)
Estratégia: coletar em lote de madrugada.

### 8.4 IBGE ✅ MVP — infraestrutura geográfica
**Base:** `https://servicodados.ibge.gov.br/api/v1/localidades`
Sem autenticação. **Não tem dados de políticos.**
Papel: CEP → município → código IBGE → cruzar com TSE.

### 8.5 TSE ✅ Fases 2 e 3
**Base:** `https://dadosabertos.tse.jus.br`
Sem API REST — só CSVs por eleição/UF.
Contém: prefeitos, vereadores, governadores eleitos, fotos, doações de campanha.
Atalho: **Brasil.IO** (brasil.io/dataset/eleicoes-brasil) já processou os CSVs via API REST.

### 8.6 ViaCEP ✅ MVP
**Base:** `https://viacep.com.br/ws/{cep}/json`
Sem autenticação. CEP → UF → deputados federais do estado.

### 8.7 Câmaras Municipais ⚠️ Fase 4
5.570 sistemas diferentes, sem padrão nacional. Algumas capitais têm API (SP, RJ, BH). Maioria não tem dados estruturados.

---

## 9. O problema dos vereadores

O TSE sabe quem é o vereador (resultado da eleição). O que ele fez no mandato — votações, gastos, presença — fica em cada câmara municipal, com sistema próprio. Não existe API nacional para isso. É a maior lacuna de transparência do Brasil.

- Fase 3: mostrar quem são os vereadores (via TSE) — sem dados de atuação
- Fase 4: dados de atuação — câmara por câmara, capitais primeiro

---

## 10. Escopo do MVP — 15 dias

### O que entra
- [ ] Home com busca por nome e por CEP
- [ ] Comunicação visual de todos os níveis políticos (mesmo sem todos os dados)
- [ ] Perfil do político (cargo, partido, estado, foto)
- [ ] Votações (✔ sim / ✖ não / ⚪ ausente)
- [ ] Presença em plenário (%)
- [ ] Gastos com cota parlamentar
- [ ] Custo total do mandato (salário + cota)
- [ ] Link para fonte oficial em cada dado
- [ ] "Quem me representa" por CEP/UF
- [ ] Cadastro e login (e-mail ou Google)
- [ ] Painel "Meus Políticos"
- [ ] Feed de atividades dos políticos acompanhados
- [ ] Layout responsivo (mobile first)

### O que NÃO entra no MVP
- Senadores, governadores, prefeitos, vereadores (dados)
- Comparações entre políticos
- Alertas/notificações push
- IA de resumo e tradução
- Recursos PRO pagos
- Emendas parlamentares

### Escopo de dados do MVP
**513 deputados federais** — API padronizada, sem autenticação, dados completos.

---

## 11. Área do usuário — "Meus Políticos"

### Fluxo
```
1. Usuário acessa meuspoliticos.com
2. Pesquisa político por nome ou CEP
3. Abre perfil → clica "Acompanhar"
4. Sistema pede cadastro (e-mail ou Google)
5. Acessa painel "Meus Políticos"
6. Vê feed com tudo que seus políticos fizeram
```

### O que o painel mostra
- Feed cronológico de votações dos políticos acompanhados
- Resumo de gastos do mês
- Percentual de presença
- Botão para adicionar/remover políticos

---

## 12. Eleições 2026 — feature especial

### Contexto
Eleições gerais em outubro de 2026. Disputados: presidente, governadores, senadores (1/3), deputados federais, deputados estaduais.
Municipais (prefeitos e vereadores) foram em 2024 — próximas em 2028.

### O que o TSE entrega por candidato
- Nome, partido, cargo disputado, estado/município
- Foto oficial
- Proposta de governo (PDF)
- Bens declarados
- Situação do registro (deferido / indeferido / cassado)
- Histórico de candidaturas anteriores
- Doações de campanha (após início da campanha)

**Base:** `https://dadosabertos.tse.jus.br` — CSVs por eleição e UF
**Atalho:** Brasil.IO já processa e expõe via API REST

### Calendário eleitoral 2026 (estimado)
| Data | Evento |
|---|---|
| Abril–Junho 2026 | Convenções partidárias |
| Agosto 2026 | Registro de candidaturas no TSE |
| Agosto–Setembro | TSE libera dados dos candidatos |
| Setembro 2026 | Dados completos disponíveis para coleta |
| 4 Outubro 2026 | Primeiro turno |
| 25 Outubro 2026 | Segundo turno |

### Fluxo de dados
```
TSE CSV de candidatos 2026
→ Python processa e salva no banco
→ PDF da proposta → extração de texto → OpenAI
→ resumo em 5 tópicos em linguagem simples
→ salvo no banco → exibido no perfil do candidato
```

### Integração com "Quem me representa"
Quando o usuário digitar o CEP, além dos representantes atuais, verá:

```
[Representantes atuais]     [Candidatos 2026]
Seu deputado hoje           Quem quer substituí-lo
O que fez no mandato        O que promete fazer
```

Isso é o produto completo: transparência passada + transparência futura.

### Nova tabela no banco: `candidatos`
```sql
CREATE TABLE candidatos (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  nome_urna       text,
  partido         text,
  cargo           text,
  uf              text,
  municipio_id    uuid references municipios(id),
  foto_url        text,
  situacao        text,  -- 'deferido' | 'indeferido' | 'cassado'
  proposta_url    text,  -- URL do PDF original no TSE
  proposta_resumo text,  -- resumo gerado por IA (5 tópicos)
  proposta_temas  text,  -- temas principais separados por vírgula
  bens_declarados numeric,
  id_tse          text,
  eleicao_ano     integer default 2026,
  ia_processado   boolean default false,
  atualizado_em   timestamp default now()
);
```

### Três perfis de candidato — lógica de exibição

Todo candidato de 2026 se enquadra em um dos três perfis abaixo. A plataforma identifica automaticamente o perfil cruzando TSE + API Câmara + API Senado.

#### Perfil A — Candidato em exercício
Está no cargo agora e busca reeleição ou novo cargo.
Cruzamento: `id_camara` ou `id_senado` ativo na tabela `politicos`.

Exibe:
- Banner "Atualmente em exercício como [cargo]"
- Dados completos do mandato atual: presença, gastos, votações
- Histórico de candidaturas anteriores (TSE)
- Proposta 2026

#### Perfil B — Ex-mandatário
Já exerceu mandato, não está em exercício agora.
Cruzamento: histórico no TSE com eleito=sim em anos anteriores + sem registro ativo na Câmara/Senado.

Exibe:
- Banner "Já exerceu [cargo] em [período]"
- Dados do mandato anterior: presença, gastos, votações
- Histórico de candidaturas (TSE)
- Proposta 2026

#### Perfil C — Primeira candidatura / sem mandato
Nunca exerceu mandato eletivo.
Cruzamento: nenhum registro como eleito no histórico TSE + sem id_camara/senado.

Exibe:
- Banner "Primeira candidatura a cargo eletivo" ou "Candidato sem mandato anterior"
- Apenas proposta 2026 e dados cadastrais do TSE
- Bens declarados

### Campo adicional na tabela `candidatos`
```sql
perfil_tipo    text,  -- 'em_exercicio' | 'ex_mandatario' | 'sem_mandato'
politico_id    uuid references politicos(id),  -- se perfil A ou B
mandatos_ant   integer default 0,  -- quantas vezes foi eleito antes
candidaturas   integer default 0,  -- quantas vezes foi candidato no total
```
### Regra de exibição — totais + detalhe ano a ano

Em todas as telas com dados históricos, sempre dois níveis:

**Nível 1 — Resumo total (topo)**

| Dado | Formato |
|---|---|
| Candidaturas | "5 candidaturas ao total" |
| Mandatos exercidos | "3 mandatos exercidos" |
| Primeira eleição | "Eleito pela primeira vez em 2010" |
| Total gasto no mandato | "R$ 412.000 gastos no mandato" |
| Presença média no mandato | "89% de presença média no mandato" |
| Total de votações | "1.248 votações registradas" |

**Nível 2 — Detalhe ano a ano (lista abaixo)**

Candidaturas:
```
2026 · Dep. Federal · PT · SP → Candidato (em curso)
2022 · Dep. Federal · PT · SP → Eleito
2018 · Dep. Federal · PT · SP → Eleito
2014 · Dep. Federal · PT · SP → Eleito
2010 · Vereador · PT · SP     → Não eleito
```

Gastos por ano:
```
2025 → R$ 94.320 (acima da média SP)
2024 → R$ 87.140 (na média SP)
2023 → R$ 91.800 (acima da média SP)
```

Presença por ano:
```
2025 → 87% · 2024 → 79% · 2023 → 94%
```

Regras:
- Total/resumo sempre antes do detalhe
- Detalhe colapsável quando tiver mais de 4 itens ("Ver todos")
- Comparativo com média sempre presente nos dados de mandato

### Regra de neutralidade
- A plataforma **não ranqueia** candidatos
- A plataforma **não recomenda** candidatos
- A plataforma **não compara** propostas editorialmente
- Mostra dados do TSE + resumo da proposta — o eleitor conclui sozinho
- Candidatos exibidos em **ordem alfabética** — nunca por popularidade ou partido

### Página dedicada ao candidato
`/candidato/[id]` — tela própria, distinta do perfil de político em exercício.
Estrutura: foto + dados + proposta resumida + histórico de candidaturas anteriores.

### Regra de exibição no CEP
- Se o candidato concorre a cargo federal/estadual → filtra por UF do CEP
- Se concorre a cargo municipal → filtra por código IBGE do município do CEP
- Exibido em seção separada "Candidatos 2026" — nunca misturado com representantes atuais

---

## 13. Processamento de dados com IA — decisões técnicas

### O problema
A API da Câmara retorna ementas técnicas e jurídicas:
```
"Altera a Lei nº 5.172, de 25 de outubro de 1966 (Código Tributário Nacional), 
para dispor sobre o regime de tributação dos produtos sujeitos à incidência monofásica."
```

O usuário precisa ver:
```
Reforma tributária sobre produtos de consumo
Tema: Economia
```

### Decisão: processamento em lote, não em tempo real

O script Python de coleta já passa a ementa pela OpenAI e salva
os campos `descricao_simples` e `tema` no banco antes de o frontend
precisar deles. Zero latência para o usuário. Custo controlado.

```
API Câmara → ementa crua → Python → OpenAI API
→ descricao_simples + tema → Supabase
→ frontend exibe diretamente (sem chamada extra)
```

### Campos no banco (já previstos no schema)
- `votacoes.descricao` — ementa original da API (sempre preservada)
- `votacoes.descricao_simples` — tradução em linguagem simples (gerada por IA)
- `votacoes.tema` — categoria temática (gerada por IA)

### Prompt padrão para tradução
```
Dado o título oficial de um projeto de lei brasileiro:
"{ementa}"

Responda APENAS em JSON válido, sem texto adicional:
{
  "titulo": "descrição em até 10 palavras em linguagem simples",
  "tema": "exatamente uma opção: Economia | Social | Educação | Saúde | Segurança | Meio Ambiente | Política | Outro"
}
```

### Temas disponíveis
| Tema | Exemplos de projetos |
|---|---|
| Economia | impostos, orçamento, privatizações, previdência |
| Social | assistência, habitação, trabalho, família |
| Educação | ensino, universidades, alfabetização |
| Saúde | SUS, medicamentos, planos de saúde |
| Segurança | penas, polícia, crimes, armas |
| Meio Ambiente | clima, desmatamento, recursos naturais |
| Política | eleições, partidos, cargos públicos |
| Outro | tudo que não se encaixa acima |

### Regra de fallback
Se a OpenAI falhar ou retornar JSON inválido:
- `descricao_simples` recebe os primeiros 80 caracteres da ementa original
- `tema` recebe "Outro"
- Uma flag `ia_processado = false` marca o registro para reprocessamento

### Custo estimado
- ~500 votações por deputado × 513 deputados = ~256.500 ementas na carga inicial
- GPT-4o-mini: ~$0.15 por 1M tokens de entrada
- Estimativa: cada ementa ~100 tokens = ~$3.85 total na carga inicial
- Atualização diária: ~50 novas votações/dia = custo desprezível

---

## 14. Arquitetura em camadas

```
Camada 1 — Coleta
  Python scripts via GitHub Actions (cron diário às 6h)
  APIs públicas → Supabase

Camada 2 — Banco estruturado
  Supabase PostgreSQL
  Todo registro com link_fonte para origem oficial

Camada 3 — IA (fase 2)
  OpenAI API:
  · Tradução de juridiquês → linguagem simples
  · Resumo de PLs, discursos, votações
  · Comparação voto × promessa de campanha
  · Detecção de padrão de posicionamento

Camada 4 — Interface
  Next.js · mobile first · < 2s de carregamento
```

---

## 15. Mapa de páginas

### Área pública (sem login)
| Rota | Descrição | MVP |
|---|---|---|
| `/` | Home — busca + CEP + todos os níveis | ✅ |
| `/busca` | Resultados da busca com filtros | ✅ |
| `/politico/[id]` | Perfil do político | ✅ |
| `/politico/[id]` → votações | Como votou (descrição via IA) | ✅ |
| `/politico/[id]` → gastos | Cota parlamentar + custo total | ✅ |
| `/politico/[id]` → presença | % nas sessões + histórico | ✅ |
| `/politico/[id]` → emendas | Destino e valores | fase 2 |
| `/politico/[id]` → histórico | Mandatos anteriores | fase 2 |
| `/meu-estado` | Quem me representa — por CEP/UF | ✅ |
| `/candidato/[id]` | Perfil do candidato 2026 (3 perfis) | ✅ |

### Autenticação
| Rota | Descrição | MVP |
|---|---|---|
| `/login` | E-mail ou Google | ✅ |
| `/cadastro` | Criar conta | ✅ |
| `/recuperar-senha` | Via e-mail | ✅ |

### Área logada
| Rota | Descrição | MVP |
|---|---|---|
| `/meus-politicos` | Painel principal | ✅ |
| `/feed` | Feed cronológico de atividades | ✅ |
| `/conta` | Perfil e preferências | ✅ |

### Institucional
| Rota | Descrição | MVP |
|---|---|---|
| `/sobre` | Missão, metodologia e equipe | ✅ |
| `/fontes` | APIs usadas e como verificar | ✅ |
| `/apoie` | Doações — Guru + Asaas | ✅ |
| `/transparencia` | Como o projeto é financiado, quem apoia, ausência de vínculo partidário | ✅ |
| `/api` | Acesso PRO — documentação | fase 2 |

### Legal (obrigatório no lançamento)
| Rota | Descrição | MVP |
|---|---|---|
| `/termos` | Termos de uso da plataforma | ✅ |
| `/privacidade` | Política de privacidade e LGPD | ✅ |
| `/cookies` | Política de cookies | ✅ |
| `/metodologia` | Como coletamos e processamos dados · disclaimer sobre IA | ✅ |
| `/disclaimer` | Limitações, neutralidade, ausência de responsabilidade editorial | ✅ |
| `/correcao` | Solicitação de correção de dados | ✅ |

### Por que as páginas legais são críticas
- Dados públicos de pessoas reais — amparado pela LAI e LGPD
- IA resume ementas e propostas — disclaimer obrigatório sobre possíveis imprecisões
- Dados de políticos são públicos por lei (LAI nº 12.527/2011) — documentar isso protege a plataforma
- A fonte oficial sempre prevalece sobre o resumo gerado por IA

### `/correcao` — Solicitação de correção de dados
Qualquer pessoa pode solicitar correção — não apenas o próprio político ou candidato.
Formulário com os campos:
- Nome de quem solicita (opcional)
- E-mail para retorno (opcional)
- Político ou candidato afetado
- Qual dado está incorreto
- Qual deveria ser o dado correto
- Link da fonte oficial que comprova (obrigatório)

**Regra crítica:** dados extraídos de APIs oficiais (Câmara, Senado, TSE, Portal da Transparência) **não são corrigidos manualmente** — o erro está na fonte e deve ser reportado à fonte. A plataforma só corrige dados enriquecidos por IA (resumos, classificações de tema) ou erros de processamento interno.

Prazo de resposta sugerido: 5 dias úteis.
Solicitações sem fonte oficial comprobatória são arquivadas automaticamente.

### Total de páginas MVP
| Grupo | Qtd |
|---|---|
| Pública | 10 |
| Autenticação | 3 |
| Logada | 3 |
| Institucional | 4 |
| Legal + Correção | 6 |
| **Total** | **26** |

---

## 16. Regras de interface — mobile first

### Mobile first é obrigatório
O acesso principal à plataforma será via celular. Todo design parte do mobile e escala para desktop.

**Breakpoints:**
| Breakpoint | Largura | Uso |
|---|---|---|
| Mobile | 375–430px | Layout principal — prioridade máxima |
| Tablet | 768px | Ajustes de grid (2 colunas → 3) |
| Desktop | 1024px+ | Layout expandido, sidebar possível |

**Regras mobile:**
- Fonte mínima: 12px (nunca abaixo)
- Áreas de toque: mínimo 44×44px (botões, links, cards clicáveis)
- Scroll sempre vertical — nunca horizontal (exceto chips de filtro)
- Nav fixa no topo — nunca perde o logo e o acesso à conta
- Campos de formulário: font-size 16px mínimo (evita zoom automático no iOS)
- Cards empilhados em coluna única no mobile, grid 2×2 no tablet+

### PWA — Progressive Web App
O site será configurado como PWA desde o lançamento.
Benefícios: ícone na tela inicial do celular, abertura em tela cheia, carregamento offline do shell.

**Push notifications — fase 2**
Tecnologia: Web Push API + OneSignal ou Firebase Cloud Messaging.
O Next.js suporta PWA nativamente via `next-pwa`.
Fluxo: usuário acessa pelo celular → site solicita permissão → usuário aceita → recebe push mesmo com browser fechado.

Notificações planejadas para fase 2:
- "Seu deputado votou hoje — [nome da votação]"
- "Novo gasto registrado por [nome]"
- "[Nome] mudou de partido"
- "Candidato 2026 registrado para o cargo do seu político"

**O MVP não tem push** — o usuário vê as novidades quando abre o app. A infraestrutura de PWA já fica pronta para ativar o push na fase 2 sem refatoração.

---

## 17. Regras de interface — decisões globais

### Avatar do político
- **Com foto:** exibe imagem circular via `foto_url`
- **Sem foto:** exibe as 2 primeiras letras do nome (iniciais) com fundo colorido por cargo
- Cor do avatar por cargo (fundo / texto):

| Cargo | Fundo | Texto |
|---|---|---|
| Presidente | `#f0e8ff` | `#3c1489` |
| Governador | `#fff0e8` | `#7a3000` |
| Senador | `#e8f5ee` | `#085041` |
| Dep. Federal | `#e8eefb` | `#1a2b5e` |
| Dep. Estadual | `#fef9e8` | `#7a6000` |
| Prefeito | `#f0e8ff` | `#3c1489` |
| Vereador | `#fce8f0` | `#7a0040` |

- Deputados federais (MVP): todos os 513 têm foto disponível via `camara.leg.br/internet/deputado/bandep/{id}.jpg`
- Fases futuras (TSE): cobertura de fotos menor — fallback de iniciais será mais frequente

### Cores de presença
- Verde `#0F6E56` — presença ≥ 80%
- Âmbar `#EF9F27` — presença 60–79%
- Vermelho `#A32D2D` — presença < 60%

### Fonte de dados — nota padrão
Todo dado exibido deve ter nota de fonte com link para origem oficial.
Formato: "Dados extraídos da [API da Câmara dos Deputados]. Atualizado diariamente às 6h."

### Tom editorial — regra global
Linguagem simples, objetiva e neutra em todo conteúdo gerado pela plataforma.

| Permitido | Proibido |
|---|---|
| "Votou sim" | "Apoiou" / "defendeu" |
| "Registrou ausência" | "Faltou" / "fugiu" |
| "Apresentou PL sobre X" | "Quer acabar com X" |
| "Presença de 87%" | "Muito presente" / "pouco dedicado" |
| Dados com contexto | Adjetivação de conduta |

Sem sarcasmo · sem militância · sem clickbait · sem emojis políticos · sem adjetivação de conduta. Aplica-se a: títulos, resumos gerados por IA, notificações, labels de interface e textos institucionais.

### Redes sociais do político — regra de exibição
Exibidas no perfil como seção separada, nunca misturadas com dados oficiais.
Fontes: TSE (candidatos), sites oficiais, validação manual.
Plataformas: Instagram · X/Twitter · TikTok · YouTube · Site oficial.
Label obrigatório: "Canais do político — conteúdo de responsabilidade do parlamentar."

### Alertas personalizados — fase 2
Usuário configura quais eventos geram notificação para cada político acompanhado.

| Evento | Descrição |
|---|---|
| Votação | Sempre que o político votar em plenário |
| Falta | Quando registrar ausência em sessão |
| Gasto | Quando registrar novo gasto acima de X |
| Troca de partido | Imediato |
| Novo PL | Quando apresentar projeto de lei |
| Candidato 2026 | Quando surgir candidato para o mesmo cargo |

---

## 18. Features do perfil do político — especificação completa

### Resumo executivo (topo do perfil — acima das abas)
Bloco de contexto rápido gerado automaticamente. Sem opinião. Só fatos.

Campos:
- Cargo atual e estado
- Número do mandato ("1º mandato" / "3º mandato")
- Principais temas de atuação (baseado nos temas das votações e PLs)
- Comissões em que participa
- Total de projetos apresentados
- Partido atual + partidos anteriores (se houver troca)

Exemplo de output:
```
Deputado federal por São Paulo · 1º mandato (2023–2027)
Atua principalmente em Economia e Segurança
Membro da Comissão de Finanças e da Comissão de Constituição
34 projetos apresentados · Presença média: 87%
Partido: PL · Passou por: União Brasil (2021–2022)
```

Badge "IA" visível — gerado automaticamente, fonte oficial prevalece.

### "Última atividade" — indicador em tempo real
Exibido no topo do perfil, abaixo do nome.
Formato: ícone colorido + texto + tempo relativo.

Exemplos:
- 🟢 Votou SIM na reforma tributária · 2 horas atrás
- 🔴 Ausente na sessão plenária · ontem
- 💬 Discursou sobre saúde pública · 3 dias atrás
- 📄 Apresentou PL sobre educação · 1 semana atrás

### "O que está acontecendo agora" — seção da home
Bloco dinâmico no topo do corpo da home, abaixo do hero.
Mostra eventos em andamento ou recentes de alta relevância.

Tipos de evento:
- Votação importante em curso ou recente
- PEC em pauta
- Político cassado ou afastado
- Mudança de partido relevante
- Novo candidato 2026 registrado
- API com dados atrasados (transparência sobre limitações)

### "Políticos relacionados" — seção no perfil
Ao final do perfil, antes do footer.
Sugere outros políticos com contexto de relação — sem ranking ou hierarquia.

Grupos de relação:
- Mesmo partido e estado
- Mesma comissão
- Padrão de votação similar (fase 2 — requer cruzamento de dados)
- Disputam o mesmo cargo em 2026

### `/insights` — página dedicada (fase 2)
Central de análises e rankings da plataforma.

Seções planejadas:
- Radar Brasília — temas mais votados na semana
- Rastreador de Gastos — maiores gastos do mês, evolução histórica
- Monitor de Presença — ranking de presença, mais faltosos
- Mapa de Partidos — distribuição por bancada e tema
- Termômetro de Atividade — parlamentares mais e menos ativos
- Eleições 2026 — painel de candidatos registrados

### "Explique essa votação" — feature de contexto (fase 2)
Bloco expansível em cada votação relevante.
Gerado por IA a partir de fontes oficiais e notícias agregadas.

Conteúdo:
- O que muda com essa votação
- Quem apoia e quem critica (baseado em posicionamentos públicos)
- Impacto provável para o cidadão

Visual: seção claramente separada com badge "Contexto IA" e disclaimer obrigatório.
Nunca misturado com dados oficiais da votação.

---

## 19. Wireframes (arquivo separado)

Arquivo: `wireframes_meuspoliticos.md`

| Tela | Status |
|---|---|
| Home v2 | ✅ aprovado |
| Perfil do político v2 | ✅ aprovado |
| Busca / resultados | ✅ aprovado |
| Quem me representa (CEP) | ✅ aprovado |
| Candidato 2026 (3 perfis) | ✅ aprovado |
| Meus políticos v2 + sidebar | ✅ aprovado |
| Feed v2 + ícones | ✅ aprovado |
| Login / cadastro | ✅ aprovado |
| Sobre / Fontes / Apoie | ✅ aprovado |
| Legais + Correção | ✅ aprovado |
| Neutralidade + Status | ✅ aprovado |
| Como verificar + Glossário | ✅ aprovado |

---

## 20. Modelo de negócio

**Princípio:** nunca vender ideologia. Vender transparência, dados e inteligência cívica.

### Camada 1 — Gratuito (sempre)
Todo o núcleo é aberto. Constrói audiência, confiança e legitimidade.

### Camada 2 — Doações (dia 1)
Botão discreto: "Este projeto é independente. Apoie."

**Infraestrutura: Guru + Asaas (contrato já existente)**
- Pix único e recorrente
- Cartão de crédito
- Valores sugeridos: R$ 5 / R$ 15 / R$ 30 / livre

### Camada 3 — PRO B2B (fase 2)
| Cliente | O que compra |
|---|---|
| Imprensa | API de dados, dashboards avançados |
| Universidades | Acesso bulk, séries históricas |
| Escritórios jurídicos | Acompanhamento legislativo |
| Consultorias | Relatórios customizados |
| ONGs | Acesso com desconto |

Processado via Guru + Asaas (assinaturas recorrentes).

### Camada 4 — Patrocínios institucionais
Fundações, universidades, institutos democráticos.
Jamais partidos ou empresas com interesse político direto.

### Camada 5 — Relatórios anuais de impacto
- "Os parlamentares mais presentes do Brasil"
- "Mapa nacional de gastos com cota parlamentar"

Geração de cobertura orgânica nacional.

### Sobre publicidade (Google AdSense)
**Decisão: não usar.** O algoritmo coloca automaticamente anúncios de partidos e campanhas — destrói a credibilidade de neutralidade. Revisitar apenas com tráfego suficiente para negociar patrocínios diretos com controle total do que é exibido.

---

## 21. Schema do banco

Arquivo completo: `001_schema.sql`

| Tabela | Fonte | Fase |
|---|---|---|
| `municipios` | IBGE | MVP |
| `politicos` | Câmara / Senado / TSE | MVP |
| `votacoes` | Câmara / Senado | MVP |
| `gastos` | Câmara / Portal Transparência | MVP |
| `presenca` | Calculada dos eventos da Câmara | MVP |
| `emendas` | Portal da Transparência | Fase 2 |
| `perfis` | Supabase Auth | MVP |
| `acompanhamentos` | Gerado pelo usuário | MVP |

Views prontas: `feed_usuario` · `resumo_politico`
RLS configurado: dados públicos abertos, dados do usuário privados.

---

## 22. Plano de 15 dias

| Dias | Entrega |
|---|---|
| 1–2 | Setup: GitHub + Supabase (schema) + Vercel |
| 3–4 | Scripts Python: 513 deputados no banco |
| 5–6 | Scripts Python: votações + gastos + presença |
| 7–8 | Frontend: home + busca |
| 9–10 | Frontend: perfil do político |
| 11 | Frontend: abas votações e gastos |
| 12 | Auth + painel Meus Políticos + feed |
| 13 | Testes, ajustes, mobile |
| 14 | DNS + domínio na Vercel |
| 15 | Lançamento público |

---

## 23. Estrutura do repositório

```
meuspoliticos/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── page.tsx                  # home
│       │   ├── busca/page.tsx
│       │   ├── politico/[id]/page.tsx
│       │   ├── meu-estado/page.tsx
│       │   ├── meus-politicos/page.tsx
│       │   ├── feed/page.tsx
│       │   ├── login/page.tsx
│       │   ├── cadastro/page.tsx
│       │   ├── sobre/page.tsx
│       │   ├── fontes/page.tsx
│       │   └── apoie/page.tsx
│       └── components/
├── scripts/
│   ├── collect/
│   │   ├── deputados.py
│   │   ├── votacoes.py
│   │   ├── gastos.py
│   │   └── presenca.py
│   └── seed/
│       └── initial_load.py
├── supabase/
│   └── migrations/
│       └── 001_schema.sql
└── .github/
    └── workflows/
        └── collect_daily.yml
```

---

## 24. Princípios fundadores

A base filosófica e operacional da plataforma. Valem para decisões técnicas, editoriais, jurídicas e de produto.

1. A fonte oficial sempre prevalece sobre qualquer interpretação ou resumo
2. Neutralidade política absoluta — nenhum partido, ideologia ou candidato é favorecido
3. Transparência metodológica — como tudo funciona é público e documentado
4. Dados públicos devem ser compreensíveis por qualquer cidadão
5. IA nunca substitui a fonte original — apenas facilita a leitura
6. Todo dado deve ser rastreável até sua origem oficial
7. O cidadão decide sozinho — a plataforma informa, não opina
8. Nenhum político pode pagar por favorecimento ou visibilidade
9. Critérios de exibição são públicos, auditáveis e iguais para todos
10. Informação acima de narrativa, sempre

---

## 25. Camadas de dados — regra arquitetural

Cada dado exibido pertence a uma camada com nível de risco e tratamento visual específico. **As camadas nunca se misturam visualmente.**

| Camada | Exemplos | Risco | Visual |
|---|---|---|---|
| Dados oficiais | Votou sim/não, valor do gasto, % presença | Baixo | Sem badge — dado direto |
| Dados calculados | Custo total do mandato, média comparativa | Médio | Badge "calculado" |
| IA / interpretação | Resumo de ementa, tema da votação | Alto | Badge "IA" em âmbar |
| Notícias / reputação | "Na imprensa" | Altíssimo | Seção separada com disclaimer |

---

## 26. Hierarquia de impacto dos eventos

Todo evento do sistema recebe um nível de impacto. Usado para priorizar feed, notificações, home e insights.

| Nível | Valor | Exemplos |
|---|---|---|
| Crítico | 4 | Cassação, afastamento, troca de partido, votação constitucional |
| Alto | 3 | Votação nominal relevante, PEC, candidatura 2026 registrada |
| Médio | 2 | Votação nominal comum, novo PL apresentado, ausência em sessão |
| Baixo | 1 | Gasto de cota, discurso em plenário, participação em comissão |

**Uso por camada:**
- Feed do usuário: exibe tudo, ordena por data — impacto desempata eventos simultâneos
- Home "O que está acontecendo agora": exibe apenas `alto` e `critico`
- Notificações push (fase 2): configurável por usuário, padrão `alto` e `critico`
- Insights: agrega por nível para gerar rankings e tendências

Campo na tabela `votacoes` e `feed_eventos`: `impacto_nivel` (1–4).

---

## 27. Estado do dado — regra de exibição

Cada dado exibido tem um estado que informa sua qualidade e completude. Exibido como badge discreto quando diferente de "oficial".

| Estado | Quando usar | Visual |
|---|---|---|
| `oficial` | Dado completo e atualizado da API | Nenhum — padrão |
| `parcial` | API retornou dado incompleto | Badge cinza "parcial" |
| `atrasado` | Última coleta há mais de 24h | Badge âmbar "desatualizado" |
| `em_processamento` | IA ainda processando o resumo | Badge cinza "processando" |
| `indisponivel` | Fonte offline ou sem dados | Badge vermelho "indisponível" |

Especialmente crítico nas fases 3 e 4 — vereadores e assembleias têm dados fragmentados. O usuário precisa saber quando está vendo informação incompleta.

Campo nas tabelas relevantes: `dado_estado` (enum).

---

## 28. Trilha de auditoria — log de alterações

Cada resumo gerado por IA e cada correção manual registra uma entrada de auditoria.

**O que é registrado:**
- Data e hora da geração do resumo
- Versão do modelo de IA usado
- Data de qualquer correção manual
- Motivo da correção (solicitação de correção / revisão interna)
- Dado anterior vs dado corrigido

**Exibição no frontend:**
- Ícone discreto de histórico em cada resumo IA
- Tooltip: "Gerado em [data] · [se houver] Corrigido em [data]"
- Página `/correcao` exibe log público de correções aprovadas

**Campo nas tabelas:** `ia_gerado_em`, `ia_modelo`, `ia_corrigido_em`, `ia_corrigido_motivo`.

---

## 29. Manifesto público

Texto humano para a página `/sobre`, imprensa, investidores e deck.

---

**Por que isso existe**

O Brasil tem 594 parlamentares federais, 27 governadores, mais de 5.500 prefeitos e 57.000 vereadores. Cada um deles toma decisões que afetam sua vida, sua família, seu bairro. Todos os dias.

E a maioria dos brasileiros não sabe o nome do deputado federal que os representa.

Não por falta de interesse. Por falta de acesso.

---

**O problema não é a informação. É a distância.**

As informações existem. A Câmara publica cada votação. O Senado registra cada discurso. O TSE declara cada centavo de financiamento. O Portal da Transparência lista cada gasto.

Mas estão em 47 sistemas diferentes, em formatos que exigem paciência técnica, vocabulário jurídico e horas disponíveis. Coisas que a maioria das pessoas não tem.

Essa distância não é acidente. É o custo real da opacidade.

---

**O que fazemos**

Coletamos dados diretamente das fontes oficiais do governo brasileiro. Organizamos. Traduzimos o juridiquês para português. E exibimos tudo em segundos, para qualquer pessoa, no celular.

Do presidente ao vereador — em um só lugar.

Sem filtro editorial. Sem agenda. Sem patrocínio de partido ou ideologia.

---

**Neutralidade não é omissão**

A plataforma não diz quem é bom ou ruim. Não ranqueia por ideologia. Não compara propostas com julgamento de valor.

Isso não é omissão — é respeito.

Respeito pela sua capacidade de concluir. Pelo seu direito de ter acesso aos mesmos dados que os especialistas acessam. Pela sua inteligência como cidadão.

A transparência só funciona quando é igualmente transparente para todos os lados. O momento em que começamos a selecionar quais dados mostrar, e para quem, deixamos de ser transparência e nos tornamos mais uma narrativa.

---

**O que acreditamos**

Acreditamos que cidadãos bem informados tomam melhores decisões.

Acreditamos que informação pública deve ser compreensível por qualquer pessoa — não apenas por jornalistas, advogados e acadêmicos.

Acreditamos que tecnologia pode servir à democracia, não apenas ao mercado.

Acreditamos que um país onde cada cidadão conhece seu representante é um país mais difícil de enganar.

---

**O que não somos**

Não somos jornalismo — não temos pauta, não temos editorial, não investigamos.

Não somos militância — não defendemos causa, não fazemos campanha, não temos candidatos.

Não somos governo — não somos financiados por partido, não somos subordinados a nenhuma esfera pública.

Somos infraestrutura. O sistema operacional da cidadania política brasileira.

---

**Por onde começamos**

Pelos 513 deputados federais. Porque é onde os dados estão mais estruturados, mais acessíveis, mais verificáveis.

Depois os senadores. Os governadores. Os prefeitos. Os vereadores.

Cada fase expande o mapa. O objetivo é chegar em todos os 57 mil vereadores do país. Cada um com nome, votação, gasto e presença — visíveis para quem quiser ver.

---

**Uma promessa simples**

Qualquer erro nos dados pode ser reportado. Levamos correções a sério, com transparência sobre o que foi alterado, quando e por quê.

A fonte oficial sempre prevalece sobre qualquer resumo que geramos.

Quando usamos inteligência artificial para traduzir uma ementa técnica, dizemos isso claramente. Você sempre pode verificar o original.

---

**Transparência para decidir melhor.**

*NORO GURU — Campinas, Brasil — 2026*

---

## 30. Modo Eleição — feature especial 2026

Estado especial do sistema ativado durante o período eleitoral.
**Ativação prevista:** agosto de 2026 (após registro das candidaturas no TSE).
**Desativação:** novembro de 2026 (após segundo turno).

### O que muda na home
- Seção "Candidatos 2026" ganha destaque acima dos insights
- Mapa eleitoral por estado e cargo
- Contador de dias para o primeiro turno
- Feed de novos registros no TSE em tempo quase real

### O que muda no perfil do político em exercício
- Banner "Este político é candidato em 2026" com link para o perfil de candidato
- Comparativo direto: mandato atual vs promessas da campanha anterior (fase 2)

### O que muda no painel "Meus Políticos"
- Alert automático: "X dos seus políticos são candidatos em 2026"
- Sugestão de acompanhar os candidatos concorrentes

### Regra de neutralidade no Modo Eleição
Nenhuma mudança visual favorece candidatos específicos. Todos os candidatos do mesmo cargo e estado aparecem em ordem alfabética. Sem destaque por partido, por pesquisa de intenção de voto ou por qualquer métrica subjetiva.

---

## 31. Mapa completo de páginas e features

### MVP — lançamento (15 dias)
**Páginas de dados:**
- `/` Home
- `/busca` Busca e resultados
- `/politico/[id]` Perfil com abas: votações, gastos, presença
- `/meu-estado` Quem me representa por CEP
- `/candidato/[id]` Perfil do candidato 2026

**Área do usuário:**
- `/meus-politicos` Painel pessoal
- `/feed` Feed de atividades
- `/conta` Configurações

**Autenticação:**
- `/login` · `/cadastro` · `/recuperar-senha`

**Institucional:**
- `/sobre` · `/fontes` · `/apoie`
- `/neutralidade` — política editorial pública ✅ novo
- `/status` — status das APIs e última atualização ✅ novo

**Legal:**
- `/termos` · `/privacidade` · `/cookies`
- `/metodologia` · `/disclaimer` · `/limitacoes` ✅ novo
- `/correcao` — formulário de correção de dados

**Educacional:**
- `/como-verificar` — como interpretar dados, ausências, votações ✅ novo
- `/glossario` — PEC, PL, MP, cota parlamentar, emenda PIX e mais ✅ novo

**Total MVP: 26 páginas**

---

### Fase 2 — mês 2 ✅ COMPLETA (2026-05-12)

**Senado Federal — concluído:**
- Schema v2.8: 8 novas tabelas (`senadores`, `senado_votacoes`, `senado_materias`, `senado_comissoes`, `senado_discursos`, `senado_sessoes`, `raw_senado`, `politico_senado_ids`)
- `load_senado.py` — loader Python (450+ linhas) com entity resolution via CPF
- RLS ativo: leitura pública na camada Silver, acesso restrito na Bronze
- Deduplicação por SHA-256 na camada Bronze
- 81 senadores carregados · 45+ CPF linkages confirmados

**Pendente dentro da Fase 2:**
- ETAPAs 2–6: votações, matérias, comissões, discursos, sessões (carga completa)
- Gold layer — views analíticas planejadas:
  - Padrões de votação por partido e estado
  - NLP em discursos: extração de tópicos e palavras-chave por senador
  - Grafo de rede política: senadores agrupados por similaridade de voto
  - Timeline de atividade do senador ao longo do mandato
- Testes de integração contra a API de produção
- **"Quem me representa" — deputados por município:** mostrar deputados que tiveram mais votos no município do CEP consultado (dados TSE por zona eleitoral — requer integração com resultados eleitorais)

**Dados:**
- Senadores + presidente + governadores
- Emendas parlamentares
- Aba "Atuação parlamentar" no perfil — projetos, relatorias, discursos, requerimentos

**Features:**
- Push notifications (PWA)
- "Na imprensa" — agregador de notícias por político (com disclaimer)
- Timeline política do político — trajetória completa, mudanças de partido
- Feed visual com ícones por tipo de evento (votação, gasto, ausência, discurso)
- Selos de confiabilidade em cada dado (oficial / calculado / IA / parcial)
- Sidebar no desktop
- Área "Insights" — rankings, maiores gastos, mais ausentes, temas mais votados

### Fase 3 — mês 3–4
- Prefeitos + vereadores (quem são, via TSE)
- Deputados estaduais
- Candidatos municipais 2028 (planejamento)

### Fase 4 — 2026+
- Atuação de vereadores (câmara por câmara, capitais primeiro)
- Candidatos 2026 — dados completos pós-registro TSE (agosto 2026)

### Fase 5 — mês 6+
- Camada PRO + API paga
- Relatórios anuais de impacto
- "Currículo político completo" — visão expandida do perfil

---

## 32. Ideias futuras — grupo 3

Documentadas para não se perderem. Retomar quando a plataforma tiver escala e estrutura jurídica consolidada.

### Processos judiciais
Aba no perfil do político com status processual de STF, STJ, CNJ, TSE e TRFs.
Regra rígida: só status oficial verificável. Nunca interpretação ou adjetivos.
Campos: tribunal · número do processo · classe · status · data · link oficial.
Fontes: STF, STJ, CNJ, TSE, TRFs.
Nunca: "suspeito", "corrupto", "polêmico", score moral, ranking de corrupção.

### Estratégia de crise
Protocolo para quando um dado vier errado ou a IA resumir mal algo sensível.
Elementos: prazo de resposta definido · congelamento temporário do dado · auditoria manual · log público de alterações · transparência de correções.

### Currículo político completo
Visão de longo prazo — unir em um só lugar: trajetória, atuação, histórico, mandatos, projetos, processos, presença, posicionamentos, partidos, mudanças, eleições, mídia, redes sociais. O LinkedIn da política brasileira.

---

## 33. Visão de crescimento

| Fase | Escopo | Prazo |
|---|---|---|
| **MVP** | 513 dep. federais + área do usuário + páginas educacionais e legais | 15 dias |
| **Fase 2** ✅ | Senado Federal integrado — schema v2.8, 8 novas tabelas, loader Python, entity resolution via CPF | Mês 2 — **concluído** |
| Fase 3 | Prefeitos + vereadores (quem são) + dep. estaduais | Mês 3–4 |
| **Modo Eleição** | Estado especial do sistema para as eleições de outubro 2026 | Agosto 2026 |
| Fase 4 | Atuação de vereadores + candidatos 2026 completos | 2026+ |
| Fase 5 | PRO + API paga + relatórios + currículo político completo | Mês 6+ |

---

## 34. Arquivos do projeto

| Arquivo | Conteúdo |
|---|---|
| `meuspoliticos_master.md` | Este documento — visão geral completa |
| `001_schema.sql` | Schema completo do banco Supabase (v2.8) |
| `load_senado.py` | Loader Python — Senado Federal (Fase 2 ✅) |
| `wireframes_meuspoliticos.md` | Wireframes de todas as telas |
| `branding_meus_politicos_manifesto_identidade.md` | Manifesto e identidade visual completos |
| `logo_meuspoliticos.png` | Logo com todas as versões |

---

## 35. Painel de Administração — `/admin`

Painel interno para monitoramento e controle operacional da plataforma. **Não é um CMS.** É uma ferramenta de observabilidade e correção — o sistema roda sozinho, o painel garante que está rodando bem.

### Acesso
- Rota protegida: `/admin`
- Autenticação: login com e-mail + senha admin
- Role `admin` configurado no Supabase Auth
- Separado completamente da área do usuário comum

### Acesso
- Rota: `/admin` — protegida por senha
- Autenticação: e-mail + senha com role `admin` no Supabase Auth
- Sem formulário público — usuário admin criado diretamente no Supabase
- Escopo: equipe interna, crescendo com o projeto

### O que o Supabase Studio já resolve (não construir)
- Editar dados brutos nas tabelas
- Queries manuais de diagnóstico
- Ver logs de banco detalhados

### 7 áreas do painel

#### 1. Dashboard
Visão geral em tempo real com 4 KPIs principais:
- Total de usuários cadastrados + delta semanal
- Acessos do dia + comparativo com dia anterior
- Total de políticos no ar
- Alertas ativos (coletas com problema, erros de IA)

Seções resumidas: status das coletas (preview), fila IA (pendências), correções pendentes — tudo clicável para a área completa.

#### 2. Status das coletas
Resultado dos cron jobs do GitHub Actions em tempo real.

| Fonte | Última coleta | Status | Ação |
|---|---|---|---|
| Câmara | hoje 06h01 | ✅ OK | — |
| Senado | hoje 06h03 | ✅ OK | — |
| Portal Transparência | ontem 06h12 | ⚠️ Atrasado | Rodar agora |
| TSE | erro 04h55 | ❌ Falhou | Ver log |

Ações: rodar coleta manualmente · ver log de erro · marcar como ignorado.

#### 3. Fila de processamento IA
Controle das ementas e propostas aguardando tradução por IA.

| Item | Tipo | Status | Ação |
|---|---|---|---|
| PEC 32/2020 | Votação | ❌ Erro JSON | Reprocessar |
| Proposta João B. | Candidato | ⚠️ Revisar | Editar / Aprovar |
| PL 1847/2024 | Votação | ⏳ Processando | — |

Ações: reprocessar · editar manualmente · marcar como ignorado · aprovar resumo.

#### 4. Correções solicitadas
Fluxo de aprovação das solicitações de `/correcao`.

Fluxo: `pendente` → `aprovado` (corrige o banco) ou `rejeitado` (e-mail explicando).
Prazo: 5 dias úteis.

#### 5. Feature flags
Habilitar features sem deploy.

| Feature | Status |
|---|---|
| Insights / rankings | OFF |
| Na imprensa | OFF |
| Push notifications | OFF |
| Modo Eleição 2026 | OFF |
| Atuação parlamentar | OFF |
| Timeline política | OFF |

Tabela `feature_flags`: `nome` · `ativo` (boolean) · `descricao` · `atualizado_em`.

#### 6. Usuários
Busca por nome ou e-mail, lista paginada, ações por usuário: promover a admin · banir · ver histórico.

#### 7. Logs / erros
Log cronológico de eventos do sistema: coletas, erros de IA, erros de API, correções aprovadas, rate limits atingidos.

Níveis: erro (vermelho) · aviso (âmbar) · info (verde).

### Stack
- Next.js — mesma codebase, pasta `/app/admin`
- Supabase Auth — verificação de role `admin` em cada rota
- Server Components + Server Actions — zero backend extra
- Wireframe aprovado ✅

### Custo de desenvolvimento
1–2 dias.

### O que NÃO entra agora
❌ CMS editorial · ❌ dashboard BI · ❌ analytics avançados · ❌ multi-admin com permissões granulares · ❌ gestão de notícias

---

## 36. MVP Congelado — escopo fechado

> Esta seção é imutável durante o desenvolvimento do MVP. Qualquer nova ideia vai direto para a seção de backlog.

### O que ENTRA no MVP

**Dados:**
- 513 deputados federais
- Votações nominais
- Gastos com cota parlamentar
- Presença em sessões plenárias

**Páginas públicas:**
- Home com busca + CEP + "O que está acontecendo agora"
- Perfil do político (abas: votações, gastos, presença)
- Busca e resultados com filtros
- Quem me representa (CEP)
- Perfil do candidato 2026 (3 perfis)

**Área do usuário:**
- Login / cadastro / recuperar senha
- Meus políticos (painel)
- Feed de atividades
- Conta e preferências

**Institucional:**
- Sobre · Fontes · Apoie · Transparência

**Legal e educacional:**
- Termos · Privacidade · Cookies
- Metodologia · Disclaimer · Limitações
- Correção de dados · Neutralidade
- Status · Como verificar · Glossário

**Interno:**
- `/admin` com 7 áreas

### O que NÃO ENTRA no MVP

| Feature | Motivo |
|---|---|
| Senadores e governadores | Fase 2 |
| Emendas parlamentares | Fase 2 |
| Aba "Atuação parlamentar" | Fase 2 |
| "Na imprensa" | Fase 2 |
| Timeline política | Fase 2 |
| Insights / rankings | Fase 2 |
| Push notifications | Fase 2 |
| Sidebar desktop | Fase 2 |
| Prefeitos e vereadores | Fase 3 |
| Deputados estaduais | Fase 3 |
| Modo Eleição | Agosto 2026 |
| API paga (PRO) | Fase 5 |

---

## 37. Não fazer — nunca ou por enquanto

### Nunca
Estas features comprometem a neutralidade ou a credibilidade do projeto.

- Score político ou "ranking moral" de políticos
- Comparação ideológica automatizada
- Classificação esquerda/direita/centro
- Análise automática de corrupção ou suspeição
- Comentários de usuários sobre políticos
- Likes / dislikes em votações ou políticos
- Fórum ou comunidade
- IA conversacional sobre políticos ("o que você acha de X?")
- Conteúdo patrocinado por partidos ou campanhas
- Qualquer feature que misture dado oficial com opinião editorial

### Por enquanto (reavaliar com escala)
- Integração com redes sociais (login via Instagram, etc.)
- Notificações por SMS
- App nativo iOS/Android (PWA resolve por ora)
- Exportação de dados em PDF para o usuário
- Comparativo direto entre dois políticos ("X vs Y")

---

## 38. Regra de ouro — filtro de decisões futuras

Toda feature nova precisa responder **sim** a esta pergunta antes de entrar no backlog:

> **"Isso aumenta transparência ou só aumenta ruído?"**

Exemplos de aplicação:

| Feature | Resposta | Decisão |
|---|---|---|
| Mostrar gastos com cota | Aumenta transparência | ✅ Entra |
| Feed de votações | Aumenta transparência | ✅ Entra |
| Ranking "melhor deputado" | Aumenta ruído | ❌ Nunca |
| Comentários de usuários | Aumenta ruído | ❌ Nunca |
| Glossário político | Aumenta transparência | ✅ Entra |
| Likes em votações | Aumenta ruído | ❌ Nunca |
| Timeline política | Aumenta transparência | ✅ Entra (fase 2) |
| IA conversacional | Depende — risco alto | 🔶 Avaliar com cuidado |

---


## 39. SEO técnico, GEO e descoberta por IA

O Meus Políticos não é só um site — é uma base de dados estruturada e pública. Isso cria potencial enorme para SEO clássico e GEO (Generative Engine Optimization — ser fonte para respostas de IA como ChatGPT, Gemini, Perplexity, Claude).

### O que já está resolvido pela stack escolhida
Não precisam de ação separada — vêm por padrão:

- **Meta tags dinâmicas e OG tags** — Next.js `generateMetadata` por página
- **Core Web Vitals** — Vercel + Next.js já otimiza LCP, CLS e INP
- **Otimização de imagens** — `next/image` com WebP, lazy loading e cache
- **URLs semânticas** — `/politico/nikolas-ferreira` em vez de `/p/93hf`
- **EEAT forte** — neutralidade + fontes rastreáveis + auditoria = confiança algorítmica
- **Canonical tags e robots.txt** — configuração de 30 minutos no Next.js
- **Conteúdo citável por IA** — tom editorial factual + dados com fonte + glossário

---

### O que implementar junto com o desenvolvimento

#### 1. Sitemap dinâmico
Next.js gera automaticamente via `app/sitemap.ts`.
Estrutura em múltiplos arquivos indexados:

| Sitemap | Conteúdo |
|---|---|
| `sitemap-index.xml` | Índice geral |
| `sitemap-politicos.xml` | Perfis dinâmicos — 513 no MVP, ~64k no sistema completo |
| `sitemap-candidatos.xml` | Candidatos 2026 |
| `sitemap-glossario.xml` | Termos educacionais — SEO alto |
| `sitemap-static.xml` | Páginas institucionais e legais |

**Nota de escala:** o Google suporta até 50k URLs por arquivo de sitemap. Com ~64k políticos no sistema completo (fases 1–4), o `sitemap-politicos.xml` precisará ser dividido por fase ou por cargo quando ultrapassar esse limite. No MVP com 513 deputados não há problema.

Esforço: 1–2 horas. Impacto: indexação completa desde o dia 1.

#### 2. Structured data (JSON-LD)
Implementar junto com cada tipo de página:

| Página | Schema |
|---|---|
| Perfil do político | `Person` + `ProfilePage` |
| Candidato 2026 | `Person` + `ProfilePage` |
| Glossário | `FAQPage` + `DefinedTerm` |
| Home | `WebSite` + `Organization` |
| Sobre / Transparência | `Organization` |
| Dados abertos (fase 2) | `Dataset` |
| Todas as páginas | `BreadcrumbList` |

Exemplo para perfil do político:
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "João Bezerra",
  "jobTitle": "Deputado Federal",
  "memberOf": { "@type": "Organization", "name": "PL" },
  "url": "https://meuspoliticos.com/politico/joao-bezerra",
  "sameAs": ["https://camara.leg.br/deputados/..."]
}
```

Esforço: 2–4 horas por tipo de página. Impacto: Google AI Overview, Perplexity, Gemini.

#### 3. OG cards automáticos (compartilhamento viral)
Gerar imagens dinâmicas com `@vercel/og` para cada perfil.

Conteúdo do card:
- Foto do político (ou iniciais)
- Nome + cargo + partido + estado
- Presença % (com cor verde/vermelho)
- Gasto do ano
- Logo do Meus Políticos

Esse card aparece automaticamente no WhatsApp, X, Telegram e Threads quando alguém compartilha um perfil. Potencial viral enorme — perfis polêmicos vão circular.

Esforço: 2–3 horas. Impacto: compartilhamento orgânico massivo.

#### 4. `llms.txt`
Arquivo estático em `/public/llms.txt` — o equivalente do `robots.txt` para modelos de IA. Emergente mas estratégico — nenhum portal político brasileiro fez isso ainda.

```txt
# Meus Políticos — meuspoliticos.com

Plataforma brasileira de transparência política.
Dados públicos, fontes oficiais, neutralidade absoluta.

### Principais seções
- /politico/ — perfis de políticos em exercício
- /candidato/ — candidatos eleições 2026
- /glossario/ — termos políticos em linguagem simples
- /meu-estado — representantes por CEP

### Fontes de dados
- API Câmara dos Deputados (dadosabertos.camara.leg.br)
- API Senado Federal (legis.senado.leg.br)
- TSE (dadosabertos.tse.jus.br)
- Portal da Transparência (portaldatransparencia.gov.br)

### Política editorial
- Neutralidade política absoluta
- Sem ranking ideológico
- Dados rastreáveis com link para fonte original
- Resumos gerados por IA identificados com badge
- Metodologia pública em /metodologia

### Contato institucional
contato@meuspoliticos.com
```

Esforço: 15 minutos. Impacto: posicionamento como fonte estrutural para IA.

#### 5. Página 404 inteligente
Em vez de erro genérico, mostrar:
- "Não encontramos esse político"
- Campo de busca
- Sugestões de políticos populares
- Link para "Quem me representa" pelo CEP

Esforço: 1 hora. Impacto: retenção + SEO (reduz bounce).

---

### Fase 2 — implementar com escala

- **RSS feeds** por político, estado e tema — imprensa e power users
- **FAQ sections** no perfil do político — aumenta GEO
- **Internal linking estratégico** — político → partido → estado → comissão
- **Acessibilidade WCAG AA** — contraste, aria-labels, navegação por teclado

---

### Monitoramento — configurar no dia 1
- **Google Search Console** — indexação, erros, Core Web Vitals, queries
- **GA4** — acessos, políticos mais buscados, fluxo de navegação
- Ambos são configuração, não desenvolvimento — 30 minutos cada

---

### Resumo de esforço vs impacto

| Item | Esforço | Impacto |
|---|---|---|
| Sitemap dinâmico | 1–2h | Alto — indexação completa |
| Structured data (JSON-LD) | 2–4h/tipo | Muito alto — GEO + Google |
| OG cards automáticos | 2–3h | Muito alto — viral |
| `llms.txt` | 15min | Estratégico — AI SEO |
| Página 404 inteligente | 1h | Médio — retenção |
| Search Console + GA4 | 30min cada | Alto — monitoramento |


## 40. Próximos passos

### Planejamento — concluído ✅
1. ✅ Master doc — 40 seções
2. ✅ Schema do banco (`001_schema.sql`)
3. ✅ Branding definido
4. ✅ Wireframes completos — todas as telas v3
5. ✅ Princípios fundadores
6. ✅ Roadmap MVP → Fase 5 + Modo Eleição
7. ✅ Hierarquia de impacto, estado do dado, trilha de auditoria
8. ✅ Manifesto público + tom editorial
9. ✅ Painel `/admin` especificado e wireframado
10. ✅ MVP congelado + lista "não fazer" + regra de ouro
11. ✅ SEO técnico, GEO e `llms.txt` especificados

### Fase 2 — Senado Federal ✅ concluído (2026-05-12)
12. ✅ Schema v2.8 — 8 novas tabelas do Senado
13. ✅ `load_senado.py` — loader Python com entity resolution via CPF
14. ✅ RLS configurado (Silver público / Bronze admin)
15. ✅ Deduplicação SHA-256 na camada Bronze
16. ⬜ ETAPAs 2–6: carga completa de votações, matérias, comissões, discursos, sessões
17. ⬜ Gold layer — views de padrões de votação e atividade por senador
18. ⬜ Testes de integração contra API de produção

### Desenvolvimento — iniciar agora
12. ✅ Criar repositório no GitHub (monorepo)
13. ✅ Criar projeto no Supabase → schema v2.11 rodando (33 tabelas)
14. ✅ Criar projeto no Vercel → meuspoliticos.com.br no ar
15. ✅ Obter API Key do Portal da Transparência (gov.br)
16. ✅ Obter API Key OpenAI
17. ✅ Configurar Resend — domínio verificado
18. ✅ Cloudflare + DNS propagado
19. ✅ Next.js 15 inicializado + dependências instaladas
20. ⬜ Configurar cliente Supabase no Next.js (`lib/supabase/`)
21. ⬜ Scripts Python de coleta — deputados, votações, gastos, presença (Câmara)
22. ⬜ Construir frontend — home, busca, perfil, CEP
23. ⬜ Construir `/admin`
24. ✅ Configurar Search Console — `meuspoliticos.com.br` registrado (dados em processamento ~1 dia)

---

## 33. Metodologia científica dos scores — Radar Político

> *Baseado em metodologias academicamente validadas. Scores não são invenção da plataforma — são adaptações de índices usados por universidades, ONGs e organismos internacionais.*
>
> **Princípio:** nunca ranquear com julgamento moral. Mostrar como o político performa **em relação aos seus pares** com o mesmo perfil (partido, estado, tempo de mandato) — não uma nota absoluta de "bom ou mau".

---

### Embasamento científico por score

---

#### 1. Score de Presença
**Base:** NDI (National Democratic Institute) — checklist de sessões ponderadas por tipo

**Fórmula:**
```
Score_PRE = [(P_ord × 1.0) + (P_extra × 1.2) + (P_com × 0.8) + (P_sol × 0.2)]
            ÷ Total de Sessões Ponderadas

P_ord   = presença em sessões deliberativas ordinárias (peso 1.0)
P_extra = sessões extraordinárias (peso 1.2 — mais urgentes)
P_com   = reuniões de comissão (peso 0.8)
P_sol   = sessões solenes/debate (peso 0.2 — menor relevância decisória)
```

**Limitação conhecida:** missões diplomáticas e lideranças de partido têm ausências legítimas. Excluir do denominador ausências amparadas por missão oficial registrada.

**Fonte:** NDI Parliamentary Monitoring Guidelines · Câmara API `/deputados/{id}/eventos`

---

#### 2. Score de Atividade Legislativa (LES adaptado)
**Base:** Legislative Effectiveness Score — Volden & Wiseman (Vanderbilt/UVA) — metodologia mais citada na ciência política para medir eficácia legislativa individual

**Lógica:** não conta apenas projetos apresentados — pondera pelo estágio que cada projeto alcançou e pela importância do tema.

**Pesos por estágio:**
```
Apresentado (BILL)           → peso 1
Ação em comissão (AIC)       → peso 2
Além da comissão (ABC)       → peso 3
Aprovado na casa (PASS)      → peso 5
Sancionado (LAW)             → peso 7
```

**Pesos por tipo de projeto:**
```
Comemorativo (nome de rua, homenagem)   → α = 1
Substantivo (altera política pública)   → β = 5
Significativo (PEC, cobertura nacional) → γ = 10
```

**Score final:** normalizado pela média da legislatura (média = 1.0). Score > 1.5 = acima da média. Score < 0.5 = abaixo da média.

**Limitação conhecida:** favorece base governista (mais facilidade de aprovação). Exibir junto com dado de bancada para contextualizar.

**Fonte:** Volden & Wiseman, "Legislative Effectiveness in the United States Congress" (Cambridge University Press, 2014)

---

#### 3. Score de Transparência
**Base:** Asset and Interest Disclosure (AID) — Banco Mundial + Financial Disclosure Index (OCDE)

**Variáveis:**
```
T_prazo   (30%) = declaração TSE entregue no prazo
T_comp    (30%) = campos de descrição de bens preenchidos completamente
T_pend    (20%) = ausência de pendências na Justiça Eleitoral
T_agenda  (20%) = publicação voluntária de agenda de gabinete
```

**Fórmula:**
```
Score_TRA = (T_prazo × 0.3) + (T_comp × 0.3) + (T_pend × 0.2) + (T_agenda × 0.2)
```

**Limitação conhecida:** qualidade do preenchimento no TSE muitas vezes é baixa por erro, não má-fé. Badge de dado incompleto quando campos faltam.

**Fonte:** World Bank "Public Officials Financial Disclosure" · OCDE Financial Disclosure Index

---

#### 4. Score de Coerência Partidária (Agreement Index)
**Base:** Agreement Index (AI) — Simon Hix, Abdul Noury e Gérard Roland — usado pelo VoteWatch Europa e TheyWorkForYou (UK)

**Por que não o Rice Index:** o Rice Index ignora abstenções e superestima coesão em partidos pequenos. O AI é mais preciso.

**Fórmula:**
```
AI = [max(y, n, a) - 0.5 × (Σ(y,n,a) - max(y,n,a))] ÷ Σ(y,n,a)

y = proporção de votos Sim no partido
n = proporção de votos Não no partido
a = proporção de Abstenções

Resultado: 0 (divisão total) → 1 (unanimidade)
```

**Para o político individual:** distância entre o voto dele e o voto da maioria de sua bancada em cada votação.

**Limitação conhecida:** alta coesão pode ser disciplina imposta (chicote) — não necessariamente convergência real. Contextualizar com dado de votações contra a orientação da liderança.

**Fonte:** Hix, Noury & Roland, "Democratic Politics in the European Parliament" (Cambridge, 2007)

---

#### 5. Score de Eficiência de Gastos (CEAP normalizado)
**Base:** Clusterização regional — metodologia adaptada do Ranking dos Políticos (Brasil) + tetos por UF da Câmara

**O problema:** deputado do Acre paga passagem aérea 3× mais cara que deputado de SP. Comparação bruta é injusta.

**Fórmula:**
```
Score_GASTO = 100 × (1 - Gasto_Real_i ÷ Média_Regional_do_Gasto)

Onde Média_Regional = média de gastos de deputados da mesma UF
```

**Exemplos de teto CEAP por UF (Câmara):**
```
Acre:             R$ 57.359,87/mês
Amazonas:         R$ 56.151,46/mês
São Paulo:        R$ 48.727,46/mês
Distrito Federal: R$ 41.612,55/mês
```

**Limitação conhecida:** gastar pouco não é sempre positivo — pode indicar mandato inativo. Cruzar com Score de Atividade para calcular eficiência real (produção ÷ gasto).

**Fonte:** Ranking dos Políticos (metodologia auditada) · Câmara API `/deputados/{id}/despesas`

---

### Referências brasileiras a citar na metodologia pública

| Referência | O que faz | Como usar |
|---|---|---|
| **DIAP — "Quem Foi Quem"** | Seleciona votações por impacto social | Critério de seleção de votações relevantes |
| **Ranking dos Políticos** | Score com bônus por PL e penalidade por condenação | Base para Score de Atividade BR |
| **OLB/IESP-UERJ** | Índice de Ativismo por tema | Base para perfil temático do político |
| **Manchetômetro/IESP** | Valência da cobertura midiática | Base para "Na imprensa" com análise de tom |

---

### Como exibir os scores sem virar tribunal

**Regras de comunicação (baseadas em TheyWorkForYou e GovTrack):**

```
❌ "Este político é ruim"
❌ "Nota F — abaixo do esperado"
✅ "Vota consistentemente com sua bancada (AI = 0.87)"
✅ "Presença 12% acima da média de deputados de SP"
✅ "Atividade legislativa: 3 projetos sancionados — 2.3× a média da legislatura"
```

**Benchmark relativo — nunca absoluto:**
Sempre comparar com peers do mesmo perfil (partido + UF + tempo de mandato), não com nota absoluta de 0–100.

**Transparência radical:**
- Fórmulas públicas em `/metodologia`
- Código open source no GitHub
- Memória de cálculo por parlamentar (auditável)
- Usuário pode ajustar pesos e criar seu próprio ranking

**Proteção jurídica:**
- Dados extraídos de fontes oficiais (TSE, Câmara, Senado)
- Disclaimer: "Score baseado em análise estatística de dados públicos — não constitui julgamento moral"
- Base legal: LAI (Lei 12.527/2011) + interesse público + verdade factual como defesa

---

### Validação externa da metodologia (Gemini Deep Research)

> *Análise independente confirmou que a arquitetura metodológica escolhida é "tecnicamente inatacável".*

**Pontos validados:**

1. **LES de Volden & Wiseman** — "a decisão mais robusta para medir produtividade. Protege a plataforma contra a crítica de que estaria favorecendo parlamentares que inflam o sistema com projetos irrelevantes."

2. **Agreement Index vs Rice Index** — "tecnicamente superior para o contexto de multipartidarismo brasileiro. Mais granular por considerar abstenções e punir a fragmentação interna."

3. **Normalização regional CEAP** — "o único caminho para comparação justa. Comparar gasto bruto do Acre com o DF seria um erro metodológico grave."

4. **Segurança jurídica confirmada** — "em casos envolvendo figuras públicas, a jurisprudência exige prova de Actual Malice — extremamente difícil de sustentar contra uma plataforma que utiliza fórmulas matemáticas públicas e auditáveis baseadas em registros de Estado."

5. **Conclusão** — "transforma a plataforma de um ranking de opinião em um instrumento de auditoria cívica, permitindo que qualquer score seja replicado por pesquisadores externos."

**Posicionamento definitivo do produto:**
> *"Não somos ranking de opinião. Somos instrumento de auditoria cívica."*

Este é o argumento central para:
- Página `/sobre` e `/metodologia`
- Press kit e pitches para investidores
- Resposta a qualquer político que questionar um score
- Diferenciação de concorrentes

---

| Score | Dados necessários | Disponível agora? | Fase |
|---|---|---|---|
| Presença | `/deputados/{id}/eventos` | ⬜ ETL pendente | MVP+ |
| Eficiência de gastos | `/deputados/{id}/despesas` | ⬜ ETL pendente | MVP+ |
| Atividade (LES adaptado) | PLs + estágios (Câmara API) | ⬜ ETL pendente | Fase 2 |
| Coerência (Agreement Index) | Votações nominais por bancada | ⬜ ETL pendente | Fase 2 |
| Transparência (AID) | TSE declarações + agenda pública | ⬜ Parcial (TSE) | Fase 2 |

---

> *Baseado em research de fontes públicas brasileiras e internacionais. Cada feature usa o CPF como âncora de cruzamento. Todas são juridicamente viáveis — dados públicos por lei.*

---

### Nível 1 — Fase 2/3 (viáveis com a infraestrutura atual)

**💼 Vínculos empresariais**
Cruzar CPF com QSA da Receita Federal → mostrar todas as empresas onde o político é sócio ou administrador. Com o e-BEF (IN RFB nº 2.290/2025, vigente jan/2026) também será possível identificar onde é **beneficiário final** — mesmo sem aparecer no contrato social.

**⚖️ Dossiê jurídico (DataJud/CNJ)**
Cruzar CPF com DataJud → exibir processos em andamento em qualquer tribunal do país. Metadados públicos: quem processa, assunto, valor, tribunal. Sem conteúdo sigiloso. Detectar padrões de litigância repetitiva em múltiplos estados.

**💰 ROI político — financiamento × contratos**
Cruzar doadores de campanha (TSE) com empresas vencedoras de licitações (PNCP) → mostrar se empresas ligadas a doadores receberam contratos durante o mandato. A pergunta: "Quem financiou sua campanha ganhou contratos públicos?"

**🌿 Conflito ambiental**
Cruzar CPF com CAR (Cadastro Ambiental Rural) e embargos do IBAMA → alertar quando parlamentar com propriedades em biomas sensíveis for relator de projetos que afetam essas áreas.

**👥 Raio-X do gabinete**
Cruzar CPF de assessores (RAIS/CAGED) com QSA da Receita → detectar assessores que são sócios de empresas que recebem emendas do próprio político. Detectar nepotismo cruzado entre gabinetes.

---

### Nível 2 — Fase 3/4 (requer mais infraestrutura)

**🔄 Relógio de quarentena — porta giratória**
Monitorar ex-políticos: CPF aparece em QSA de empresa do mesmo setor de atuação antes dos 6 meses de quarentena (Lei 12.813/2013)? Alertar automaticamente.

**🏦 Rastro internacional (ICIJ)**
Cruzar nome + data de nascimento com base do ICIJ (Panama Papers, Paradise Papers, Pandora Papers) → mostrar se político ou familiares aparecem em documentos de paraísos fiscais. Base pública disponível em `offshoreleaks.icij.org`.

**📊 Índice de concentração de emendas**
Calcular: qual % das emendas do político vai para municípios onde seus doadores têm contratos? Score de 0–100. Quanto mais concentrado, maior o índice de suspeição.

**🗺️ Mapa de poder — grafo de relações**
Visualizar em grafo: político → empresas → sócios → outros políticos → contratos. Revelar a rede de influência que não aparece em dados tabulares. Referência: Poderopedia (Chile).

---

### Referências internacionais para inspirar features futuras

| Plataforma | País | Feature inspiradora |
|---|---|---|
| **OpenSecrets** | EUA | Monitoramento de lobby + ROI político |
| **TheyWorkForYou** | Reino Unido | "WhoFundsThem" — perfil de doadores por indústria |
| **Poderopedia** | Chile | Grafo de relações de poder |
| **mySociety** | Reino Unido | Padrões OCDE de auditoria de conflito de interesse |

---

### Fontes de dados para features avançadas

| Feature | Fonte | Acesso |
|---|---|---|
| Vínculos empresariais | Receita Federal QSA bulk | Gratuito — download mensal |
| Beneficiário final | e-BEF (Receita, jan/2026) | Gratuito — vigente jan/2026 |
| Dossiê jurídico | DataJud (CNJ) | API pública gratuita |
| ROI político | TSE × PNCP | Ambos gratuitos |
| Conflito ambiental | CAR + IBAMA | Gratuitos — dados abertos |
| Raio-X gabinete | RAIS/CAGED (MTE) | Gratuito |
| Quarentena | QSA + SeCI (CGU) | Gratuito |
| Rastro internacional | ICIJ Offshore Leaks | Gratuito — API pública |
| Grafo de poder | Cruzamento interno | Infraestrutura própria (Neo4j) |

---

### Princípio de exibição — nunca acusar, sempre mostrar

Todas essas features seguem o mesmo princípio do produto: **mostrar o fato, não o julgamento**.

```
❌ "Este político é corrupto"
✅ "Este político é sócio de empresa que recebeu R$ 2,3M 
    em contratos durante seu mandato"

❌ "Esta emenda é suspeita"  
✅ "87% das emendas deste político foram para municípios 
    onde seus doadores de campanha têm contratos ativos"
```

O cidadão conclui. A plataforma informa.

---
