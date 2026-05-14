# Meus Políticos — Metodologia de Scores e Métricas
> Documento técnico interno. Referência obrigatória para qualquer componente
> que exiba métricas, scores ou comparativos de políticos.
> Versão 1.0 — maio 2026

---

## Princípio fundamental

**Nunca ranquear com julgamento moral.**
Todos os scores são benchmarks relativos — o político é comparado
com peers do mesmo perfil (partido + UF + tempo de mandato).
Nunca nota absoluta de "bom ou mau".

Linguagem obrigatória nos componentes:
- ✅ "Presença 12% acima da média de deputados de SP"
- ✅ "Vota consistentemente com sua bancada (AI = 0.87)"
- ❌ "Este político é ruim"
- ❌ "Nota F — abaixo do esperado"

---

## Score 1 — Presença

**Base científica:** NDI Parliamentary Monitoring Guidelines
**Fonte de dados:** `GET /deputados/{id}/eventos` (Câmara API)
**Status:** ⬜ ETL pendente

### Fórmula
Score_PRE = [(P_ord × 1.0) + (P_extra × 1.2) + (P_com × 0.8) + (P_sol × 0.2)]
÷ Total_Sessoes_Ponderadas × 100
P_ord   = sessões deliberativas ordinárias   (peso 1.0)
P_extra = sessões extraordinárias            (peso 1.2)
P_com   = reuniões de comissão               (peso 0.8)
P_sol   = sessões solenes/debate             (peso 0.2)

### Exibição nos componentes
- Valor: percentual (ex: "78%")
- Contexto: "Média de deputados de {UF}: {media}%"
- Tendência: seta ↑↓ comparando último trimestre
- Cor: verde ≥80% · âmbar 60–79% · vermelho <60%

### Enquanto ETL não rodar
Exibir "–" com tooltip "Dados sendo coletados"

---

## Score 2 — Atividade Legislativa (LES adaptado)

**Base científica:** Legislative Effectiveness Score — Volden & Wiseman
(Cambridge University Press, 2014)
**Fonte de dados:** API Câmara — proposições + tramitação
**Status:** ⬜ ETL pendente — Fase 2

### Fórmula
LES_i = Σ (W_estagio × W_tipo × Bills_i) ÷ Media_Legislatura
Pesos por estágio:
Apresentado          → 1
Ação em comissão     → 2
Além da comissão     → 3
Aprovado na casa     → 5
Sancionado (lei)     → 7
Pesos por tipo:
Comemorativo         → 1
Substantivo          → 5
Significativo (PEC)  → 10
Normalizado: média da legislatura = 1.0

### Exibição nos componentes
- Valor: "X projetos · Y sancionados"
- Comparativo: "{N}× a média da legislatura"
- Nunca exibir score numérico bruto sem contexto

---

## Score 3 — Transparência

**Base científica:** Asset and Interest Disclosure (AID) — Banco Mundial
+ Financial Disclosure Index — OCDE
**Fonte de dados:** TSE declarações + dados Câmara
**Status:** ⬜ Parcial — Fase 2

### Fórmula
Score_TRA = (T_prazo × 0.30)
+ (T_comp  × 0.30)
+ (T_pend  × 0.20)
+ (T_agenda × 0.20)
T_prazo  = declaração TSE entregue no prazo (0 ou 1)
T_comp   = campos obrigatórios preenchidos (0–1 proporcional)
T_pend   = sem pendências na Justiça Eleitoral (0 ou 1)
T_agenda = agenda de gabinete publicada (0 ou 1)

### Exibição nos componentes
- Checklist visual dos 4 critérios
- Badge de dado incompleto quando T_comp < 1

---

## Score 4 — Coerência Partidária (Agreement Index)

**Base científica:** Agreement Index — Simon Hix, Abdul Noury & Gérard Roland
Usado pelo VoteWatch Europa e TheyWorkForYou (UK)
**Fonte de dados:** votações nominais da Câmara API
**Status:** ⬜ ETL pendente — Fase 2

### Fórmula
AI = [max(y, n, a) - 0.5 × (Σ(y,n,a) - max(y,n,a))] ÷ Σ(y,n,a)
y = proporção votos Sim no partido
n = proporção votos Não no partido
a = proporção Abstenções
Resultado: 0 (divisão total) → 1 (unanimidade)

### Para o político individual
Distância entre o voto dele e o voto da maioria de sua bancada.

### Exibição nos componentes
- "Vota com o partido em X% das votações nominais"
- Nunca usar o termo "traidor" ou equivalente
- Contextualizar: "Média do {partido}: {media}%"

---

## Score 5 — Eficiência de Gastos (CEAP normalizado)

**Base científica:** Normalização regional — Ranking dos Políticos (BR)
+ tetos oficiais CEAP por UF (Câmara dos Deputados)
**Fonte de dados:** `GET /deputados/{id}/despesas` (Câmara API)
**Status:** ⬜ ETL pendente

### Fórmula
Score_GASTO = 100 × (1 - Gasto_Real_i ÷ Media_Regional)
Media_Regional = média de gastos de deputados da mesma UF

### Tetos CEAP por UF (referência de normalização)
AC: R$ 57.359,87 | AM: R$ 56.151,46 | SP: R$ 48.727,46
DF: R$ 41.612,55 | (tabela completa em dados da Câmara)

### Exibição nos componentes
- "Gastou R$ X — {N}% abaixo/acima da média de {UF}"
- Categorias: passagens, divulgação, escritório, outros
- Nunca exibir como "econômico = bom" sem cruzar com atividade

---

## Regras de implementação para todos os componentes

### Contrato de dados de back office
Antes de implementar fallback, status de campo, ou regras de exibicao para
campos nao relacionados a score, usar como referencia obrigatoria:

`docs/BACKOFFICE_DATA_CONTRACT.md`

Este arquivo define status por campo, fallback oficial e contrato de saida
entre back office e frontend.

### Quando dados não estão disponíveis
```tsx
// SEMPRE usar este padrão — nunca exibir 0 ou null sem contexto
{valor !== null ? formatarValor(valor) : "–"}
// Tooltip obrigatório no "–": "Dados sendo coletados"
```

### Disclaimer obrigatório em toda página com scores
```tsx
<p className="text-xs text-gray-400">
  Scores calculados com base em dados oficiais da Câmara dos Deputados,
  Senado Federal e TSE. Metodologia pública em{' '}
  <a href="/metodologia">meuspoliticos.com.br/metodologia</a>.
  Não constitui julgamento moral ou profissional.
</p>
```

### Comparativo sempre com peers
```typescript
// NUNCA comparar deputado do AC com deputado do DF em gastos brutos
// SEMPRE normalizar por UF antes de comparar
const scoreGasto = calcularScoreGastoNormalizado(gasto, uf)
```

### Cores padrão por performance relativa
Acima da média (+10% ou mais)    → #16a34a (verde)
Na média (±10%)                  → #ca8a04 (âmbar)
Abaixo da média (-10% ou mais)   → #dc2626 (vermelho)
Sem dados                        → #9ca3af (cinza)

---

## Referências científicas citáveis

Volden, C. & Wiseman, A. (2014). Legislative Effectiveness in the United States Congress. Cambridge University Press.
Hix, S., Noury, A. & Roland, G. (2007). Democratic Politics in the European Parliament. Cambridge University Press.
World Bank (2012). Public Officials Financial Disclosure: A Tool to Prevent Corruption. Washington DC.
NDI (2016). Strengthening Parliamentary Accountability, Citizen Engagement and Access to Information. Washington DC.
DIAP (2023). Quem Foi Quem — Metodologia. Brasília.

---

## Página /metodologia — conteúdo

Ver seção 33 do meuspoliticos_master.md para o texto completo
da página pública de metodologia.
