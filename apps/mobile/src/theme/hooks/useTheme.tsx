import { useCallback, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { updateSettings } from '@/src/store/settingsSlice'
import { selectSettings } from '@/src/store/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { ThemePreference } from '@/src/types/theme'

export const useTheme = () => {
  const dispatch = useAppDispatch()
  const colorScheme = useColorScheme()
  const themePreference = useAppSelector(
    (state) => selectSettings(state, 'themePreference') ?? 'auto',
  ) as ThemePreference

  const setThemePreference = useCallback(
    (theme: ThemePreference) => {
      dispatch(updateSettings({ themePreference: theme }))
    },
    [dispatch],
  )

  const currentTheme = useMemo(() => {
    return themePreference === 'auto' ? colorScheme : themePreference
  }, [themePreference, colorScheme])

  return { themePreference, setThemePreference, currentTheme }
}
