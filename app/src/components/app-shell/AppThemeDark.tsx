'use client'

import { useEffect } from 'react'

/** Aplica a classe `theme-dark` no <html> enquanto o app analítico estiver montado. */
export function AppThemeDark() {
  useEffect(() => {
    document.documentElement.classList.add('theme-dark')
    return () => {
      document.documentElement.classList.remove('theme-dark')
    }
  }, [])

  return null
}
