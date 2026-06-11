# Customização do Logto para o Meus Políticos

Este documento contém o código CSS personalizado para aplicar na experiência de login do Logto para o **Meus Políticos**, alinhando-o com os tokens visuais de design do projeto (cores institucionais, fontes, bordas) e distanciando do branding padrão do *Nuru Guru*.

## Como Aplicar no Logto Console

1. Faça login no **Logto Console** (`auth.norotec.cloud`).
2. Acesse **Console** > **Sign-in & account** (ou **Applications** > **Meus Políticos** > **Sign-in Experience**).
3. No painel de **Branding**, procure pelo campo **Custom CSS**.
4. Copie todo o código abaixo e cole no campo de texto do editor.
5. Salve as alterações.

---

## Código CSS Customizado

```css
/* ==========================================
   MEUS POLÍTICOS — LOGTO CUSTOM THEME
   ========================================== */

/* 1. Sobrescrita de Variáveis Globais do Logto */
:root {
  --color-primary: #1d3a8a !important;        /* --brand (#1d3a8a) */
  --color-primary-hover: #2952cc !important;  /* --brand-2 (#2952cc) */
  --color-primary-active: #1d3a8a !important;
  --color-text: #0a0e1a !important;           /* --ink (#0a0e1a) */
  --color-text-secondary: #525866 !important; /* --ink-3 (#525866) */
  --color-background: #f4f5f0 !important;     /* --bg (#f4f5f0) */
  --color-surface: #ffffff !important;        /* --panel (#ffffff) */
  --color-border: #e3e5dd !important;         /* --line (#e3e5dd) */
  --border-radius-large: 10px !important;     /* --radius (10px) */
  --border-radius-medium: 6px !important;
  --border-radius-small: 4px !important;
}

/* 2. Estilização do Fundo e Estrutura da Página */
body, html {
  background-color: #f4f5f0 !important;
  font-family: 'Public Sans', system-ui, -apple-system, sans-serif !important;
  color: #0a0e1a !important;
}

/* 3. Card de Login Central */
div[class*="Card"], .card, .main-content, div[class*="Container"] {
  background-color: #ffffff !important;
  border: 1px solid #e3e5dd !important;
  box-shadow: 0 4px 20px -2px rgba(10, 14, 26, 0.08) !important;
  border-radius: 10px !important;
}

/* 4. Logotipo — Sizing e Alinhamento */
img[class*="logo"], .brand-logo, .logo-container img {
  max-height: 44px !important;
  width: auto !important;
  object-fit: contain !important;
  margin-bottom: 24px !important;
}

/* 5. Inputs de Texto */
input, select, textarea {
  background-color: #ffffff !important;
  border: 1px solid #cdcfc4 !important;
  border-radius: 6px !important;
  color: #0a0e1a !important;
  padding: 12px 16px !important;
  font-size: 14px !important;
  transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
}
input:focus {
  border-color: #2952cc !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(41, 82, 204, 0.15) !important;
}

/* 6. Botões de Ação Principal */
button[type="submit"], button[class*="Button"] {
  background-color: #1d3a8a !important;
  color: #ffffff !important;
  border-radius: 6px !important;
  font-weight: 600 !important;
  padding: 12px 16px !important;
  font-size: 14px !important;
  transition: background-color 0.15s ease !important;
  border: none !important;
}
button[type="submit"]:hover, button[class*="Button"]:hover {
  background-color: #2952cc !important;
}

/* 7. Botões Sociais e Conectores de Terceiros */
button[class*="SocialButton"], button[class*="ConnectorButton"] {
  border: 1px solid #cdcfc4 !important;
  background-color: #ffffff !important;
  border-radius: 6px !important;
  color: #1f2937 !important;
  font-weight: 500 !important;
  transition: background-color 0.15s ease, border-color 0.15s ease !important;
}
button[class*="SocialButton"]:hover, button[class*="ConnectorButton"]:hover {
  background-color: #fafaf7 !important;
  border-color: #cdcfc4 !important;
}

/* 8. Links de Ajuda, Esqueci a Senha e Cadastro */
a, button[class*="Link"] {
  color: #2952cc !important;
  text-decoration: none !important;
  font-weight: 500 !important;
}
a:hover, button[class*="Link"]:hover {
  text-decoration: underline !important;
  color: #1d3a8a !important;
}

/* 9. Textos de Ajuda e Muted */
p[class*="helper"], span[class*="muted"], .helper-text {
  color: #525866 !important;
  font-size: 13px !important;
}
```
