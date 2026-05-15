'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  toggle: () => void
}

const ThemeCtx = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('mp-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
    localStorage.setItem('mp-theme', theme)
  }, [theme])

  return (
    <ThemeCtx.Provider
      value={{
        theme,
        toggle: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
      }}
    >
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
