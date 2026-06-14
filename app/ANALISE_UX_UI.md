# Análise de UI/UX e Estruturação de Tema

Esta é uma análise focada em melhorar a User Experience (UX) e User Interface (UI) do portal Meus Políticos, com prioridade para a mentalidade **Mobile-First** e a inclusão da arquitetura de **Tema Claro (Light Mode)**.

## 1. Desafios Identificados no Código Atual

Ao auditar os componentes front-end (como `HomeCidadaoClient.tsx`, `SiteHeader.tsx` e `globals.css`), observei os seguintes pontos:

### 1.1 Acoplamento de Estilos Inline e Valores Hardcoded
- Vários elementos cruciais utilizam a prop `style={{ background: '#1E293B', color: '#8B5CF6' }}` em vez de depender inteiramente das classes de utilidade do Tailwind.
- Isso impossibilita a transição fácil entre modos claro e escuro, pois estilos inline sempre sobrepõem as classes.

### 1.2 Responsividade (Mobile-First)
- Atualmente, a responsividade parece ter sido construída de forma "Desktop-Down" em alguns pontos (ex: grids largos forçando quebras tardias).
- **O que deve mudar:** Todos os containers principais devem assumir 100% da largura na versão mobile (`flex-col`, `w-full`) e escalonar em telas maiores usando prefixos como `sm:`, `md:`, e `lg:`.
- **Interações Touch:** Botões, abas e links devem possuir áreas de toque (touch targets) de no mínimo 44x44 pixels em dispositivos móveis, e o uso de hover states complexos deve ser repensado para comportamentos adequados ao touch (ex: usar feedback visual no "active").

### 1.3 Variáveis de Cor (CSS)
- O arquivo `globals.css` está muito bem estruturado em relação aos tokens de design, porém o `:root` está abrigando a paleta Dark por padrão.

## 2. A Solução Proposta

Para evoluir a interface do portal de forma sustentável, propomos os seguintes passos que guiarão nosso refatoramento:

### 2.1 Refatoração do CSS Global (Tema Light)
O `:root` deve passar a representar o modo **claro**, garantindo um background iluminado, textos escuros de alto contraste e painéis com sombras sutis. A paleta escurecida atual será movida para um seletor `.dark`, como abaixo:

```css
/* LIGHT MODE (Default) */
:root {
  --bg: #F8FAFC;         /* Fundo da página */
  --bg-2: #F1F5F9;
  --panel: #FFFFFF;      /* Cartões */
  --panel-2: #F8FAFC;
  --line: #E2E8F0;       /* Bordas sutis */
  --line-strong: #CBD5E1;

  --ink: #0F172A;        /* Texto principal */
  --ink-2: #334155;
  --ink-3: #64748B;
  --mute: #94A3B8;

  --brand: #6366F1;      /* Roxo do brand */
  --brand-2: #4F46E5;
  /* ... resto das variáveis de status ... */
}

/* DARK MODE */
.dark {
  --bg: #0F172A;
  --bg-2: #0F172A;
  --panel: #1E293B;
  /* ... variáveis atuais ... */
}
```

### 2.2 Trocar estilos Inline por Tailwind
Todos os componentes deverão adotar classes baseadas nos tokens CSS, por exemplo:
- `style={{ background: 'var(--panel)', color: 'var(--ink)' }}` se tornará `className="bg-panel text-ink"`.
- As cores hardcoded como `bg-[#1E293B]` se tornarão `bg-panel`.

### 2.3 Provider de Tema com `next-themes`
Implementação do `ThemeProvider` no `layout.tsx` global para permitir a alternância de temas sem "flicker" de tela, respeitando também a preferência do sistema operacional (`system`).

### 2.4 Ajustes Mobile-First em Componentes
- **Tipografia:** Usar `text-base` como padrão legível para mobile, crescendo para `md:text-lg` e `lg:text-xl` em subtítulos e títulos.
- **Grids e Espaçamento:** Ajustar seções de listagem (como Votações e Cards Cívicos) para usarem `grid-cols-1 gap-4` no mobile e `md:grid-cols-2 lg:grid-cols-4` para desktop.
- **Header:** Simplificar o header mobile para um menu acessível "hamburger", movendo as chamadas primárias (como login e painel) para dentro dele, se o espaço horizontal for pequeno.

---
## Conclusão
Essa fundação será aplicada de forma iterativa, permitindo que a aplicação expanda com um suporte nativo e consistente aos modos Dark e Light, além de garantir uma experiência fluída na palma da mão de qualquer eleitor.