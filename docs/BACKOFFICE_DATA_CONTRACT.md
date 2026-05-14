# Back Office Data Contract - Perfil de Politico

Status: ativo
Versao: 1.0
Ultima atualizacao: 2026-05-14
Responsavel: Back Office e ETL

## 1. Objetivo

Este documento define o contrato oficial de dados entre back office e frontend para o perfil de politico.

Principios:
- Fonte unica de verdade para status de campo e fallback de exibicao.
- Sem regra de fallback no frontend fora deste contrato.
- Sem duplicacao de regra em arquivos de agente.

## 2. Ordem de precedencia

Quando houver conflito entre documentos, aplicar nesta ordem:
1. BACKOFFICE_DATA_CONTRACT.md
2. METRICS.md (apenas para scores e indicadores)
3. data_source_master.md (fonte e arquitetura)
4. CLAUDE.md e AGENTS.md (apenas referencia operacional)

## 3. Modelo de status por campo

Todo campo no payload de perfil deve retornar:
- value: valor normalizado para UI
- status: um dos estados abaixo
- source: tabela.coluna de origem
- updated_at: timestamp de ultima atualizacao do campo

Estados permitidos:
- available: valor valido disponivel
- not_informed: valor ausente ou nulo na fonte oficial
- collecting: coleta prevista, ainda sem disponibilidade operacional
- blocked_source: fonte indisponivel por erro externo
- invalidated: valor descartado por regra de qualidade

## 4. Politica de exibicao na UI

Regra geral para campos cadastrais e biograficos:
- Se status != available, exibir: Nao informado

Regra para scores e series de ETL futuro:
- Seguir METRICS.md
- Quando score nao estiver operacional, exibir: Dados sendo coletados

Regra obrigatoria:
- Frontend nao decide entre Nao informado e Dados sendo coletados por conta propria.
- O backend entrega text_value pronto para exibicao.

## 5. Catalogo de campos do perfil V2

| Campo UI | Payload | Origem | Regra de normalizacao | Fallback |
|---|---|---|---|---|
| Nome de exibicao | profile.display_name | politicos.nome_eleitoral ou politicos.nome | trim e title case | Nao informado |
| Nome civil | profile.nome_civil | politicos.nome_civil | trim | Nao informado |
| Cargo | profile.cargo_label | politicos.cargo | map enum para label publico | Nao informado |
| Partido | profile.partido_sigla | partidos.sigla | uppercase | Nao informado |
| UF mandato | profile.uf | politicos.uf | uppercase | Nao informado |
| Mandato inicio | profile.mandato_inicio | politicos.mandato_inicio | data ISO -> dd/MM/yyyy | Nao informado |
| Mandato fim | profile.mandato_fim | politicos.mandato_fim | data ISO -> dd/MM/yyyy | presente quando null e status available |
| Em exercicio | profile.years_in_office | derivado de mandato_inicio | ano atual - ano inicio | Nao informado |
| Naturalidade | profile.naturalidade | politicos.naturalidade | trim | Nao informado |
| UF nascimento | profile.uf_nascimento | politicos.uf_nascimento | uppercase | Nao informado |
| Escolaridade | profile.escolaridade | politicos.escolaridade | trim | Nao informado |
| Ocupacao | profile.ocupacao | politicos.ocupacao | trim | Nao informado |
| Sexo | profile.sexo_label | politicos.sexo | M/F/O -> Masculino/Feminino/Outro | Nao informado |
| Email gabinete | contact.email | politicos.gabinete_email ou politicos.email | lowercase | Nao informado |
| Telefone gabinete | contact.phone | politicos.gabinete_telefone | formatacao nacional, caso 3215-xxxx prefixar (61) | Nao informado |
| Gabinete | contact.office | politicos.gabinete_nome | prefixo Gabinete quando numerico | Nao informado |
| Presenca atual | stats.presenca_pct | politicos.presenca_pct_atual | round inteiro + sufixo % | Nao informado |
| Cota anual | stats.gasto_total_ano | politicos.gasto_total_ano | moeda BRL | Nao informado |
| Votacoes total | stats.total_votacoes | politicos.total_votacoes | inteiro | Nao informado |
| Ultima atualizacao | meta.last_update | politicos.collected_at | data/hora local | Nao informado |

## 6. Matriz de decisao de fallback

| Cenario | Exemplo | Resposta backend | UI |
|---|---|---|---|
| Coluna existe e valor valido | presenca_pct_atual = 78 | status=available, text_value=78% | 78% |
| Coluna existe e valor nulo | escolaridade = null | status=not_informed, text_value=Nao informado | Nao informado |
| Coleta ainda nao habilitada para score | LES sem ETL | status=collecting, text_value=Dados sendo coletados | Dados sendo coletados |
| Fonte fora do ar | API externa 503 | status=blocked_source, text_value=Nao informado | Nao informado |
| Valor invalido por QA | telefone malformado | status=invalidated, text_value=Nao informado | Nao informado |

## 7. SLA de atualizacao

| Bloco | Frequencia alvo | Atraso aceitavel |
|---|---|---|
| Dados cadastrais de politico | diaria | 24h |
| Contato de gabinete | diaria | 24h |
| Presenca e votacoes | diaria (fase atual) | 24h |
| Scores LES, AI e eficiencia gastos | quando ETL entrar em producao | definir por pipeline |

## 8. Contrato minimo de payload

Exemplo conceitual:

- profile.display_name.value
- profile.display_name.status
- profile.display_name.source
- profile.display_name.updated_at

Repetir este padrao para todo campo exposto na UI.

## 9. Requisitos de implementacao

- Nenhum endpoint de perfil deve retornar null cru para campo renderizado.
- Todo valor deve chegar com status e text_value.
- Testes de contrato devem validar que todos os campos do dashboard V2 tem status.
- O frontend deve tratar text_value como saida final de exibicao.

## 10. Checklist de rollout

1. Atualizar migration para campos ainda ausentes na tabela politicos.
2. Regenerar tipagem do Supabase.
3. Atualizar endpoint de perfil para retornar status por campo.
4. Adequar frontend para consumir text_value e status.
5. Validar dashboard V2 com politicos completos e incompletos.
6. Publicar changelog de contrato.
