import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'

const isSystemDarkMode = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useDarkMode = (): boolean => {
  const settings = useAppSelector(selectSettings)
  // The effect below persists the resolved theme to <html data-theme>. Read it
  // synchronously on first render so a remount (e.g. Next.js route change)
  // doesn't flash light-mode for a frame before the effect runs.
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.dataset.theme === 'dark'
  })

  useEffect(() => {
    const isDark = settings.theme.darkMode ?? isSystemDarkMode()

    setIsDarkMode(isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [settings.theme.darkMode])

  return isDarkMode
}
