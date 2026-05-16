'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  toggle: () => void
}

const ThemeCtx = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(null)

  // Lê o localStorage uma única vez após montar — evita inconsistência de hydration
  useEffect(() => {
    const saved = localStorage.getItem('mp-theme') as Theme | null
    setTheme(saved === 'light' || saved === 'dark' ? saved : 'dark')
  }, [])

  // Aplica a classe no <html> sempre que o tema mudar
  useEffect(() => {
    if (theme === null) return
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
    localStorage.setItem('mp-theme', theme)
  }, [theme])

  const resolvedTheme: Theme = theme ?? 'dark'

  return (
    <ThemeCtx.Provider
      value={{
        theme: resolvedTheme,
        toggle: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
      }}
    >
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
