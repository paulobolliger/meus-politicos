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

  useEffect(() => {
    const saved = localStorage.getItem('mp-theme') as Theme | null
    setTheme(saved === 'light' || saved === 'dark' ? saved : 'dark')
  }, [])

  useEffect(() => {
    if (theme === null) return
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
      <div
        className={resolvedTheme === 'dark' ? 'theme-dark' : ''}
        style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}
      >
        {children}
      </div>
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
