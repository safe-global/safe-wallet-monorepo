import { useCallback } from 'react'
import { useColorScheme } from 'react-native'
import { updateSettings } from '@/src/store/settingsSlice'
import { selectSettings } from '@/src/store/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { ThemePreference } from '@/src/types/theme'

export const useTheme = () => {
  const dispatch = useAppDispatch()

  // The logical OR is intentional to ensure colorSchemeOS is never `null`.
  // This makes it easier to use in the rest of the codebase without having to check for null.
  const colorSchemeOS = useColorScheme() || undefined

  const themePreference = useAppSelector(
    (state) => selectSettings(state, 'themePreference') ?? 'auto',
  ) as ThemePreference

  const setThemePreference = useCallback(
    (theme: ThemePreference) => {
      dispatch(updateSettings({ themePreference: theme }))
    },
    [dispatch],
  )

  const colorScheme = themePreference === 'auto' ? colorSchemeOS : themePreference

  return {
    themePreference,
    setThemePreference,
    colorScheme,
    isDark: colorScheme === 'dark',
  }
}
