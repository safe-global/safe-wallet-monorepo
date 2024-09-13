import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'

export const useDarkMode = (): boolean => {
  const settings = useAppSelector(selectSettings)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  useEffect(() => {
    const isDark = false

    setIsDarkMode(isDark)
    document.documentElement.setAttribute('data-theme', 'light')
  }, [settings.theme.darkMode])

  return isDarkMode
}
