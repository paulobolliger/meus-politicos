'use client'

import { useTheme } from '@/components/app-shell/ThemeProvider'
import { HomeAppLight } from '@/components/app-shell/home/HomeAppLight'
import { HomeAppDark } from '@/components/app-shell/home/HomeAppDark'

export default function AppHomePage() {
  const { theme } = useTheme()
  return theme === 'dark' ? <HomeAppDark /> : <HomeAppLight />
}
