import { useEffect, useState } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

// The preview skips the app store, so it applies the theme the way useDarkMode does in the app.
export function usePrototypeDarkMode(): [boolean, (dark: boolean) => void] {
  const [stored, setStored] = useLocalStorage<boolean>('prototypeDarkMode')
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    setSystemDark(!!window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    const theme = new URLSearchParams(window.location.search).get('theme')
    if (theme === 'dark' || theme === 'light') setStored(theme === 'dark')
  }, [setStored])

  const isDark = stored ?? systemDark
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return [isDark, setStored]
}
