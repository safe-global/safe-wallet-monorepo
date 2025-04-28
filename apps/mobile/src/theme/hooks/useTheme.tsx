import { useCallback, useEffect, useState } from 'react'
import { AppState, ColorSchemeName, useColorScheme } from 'react-native'
import { updateSettings } from '@/src/store/settingsSlice'
import { selectSettings } from '@/src/store/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { ThemePreference } from '@/src/types/theme'

export const useTheme = () => {
  const dispatch = useAppDispatch()
  const colorScheme = useColorScheme()
  const [currentTheme, setTheme] = useState<ColorSchemeName>(colorScheme)

  const themePreference = useAppSelector(
    (state) => selectSettings(state, 'themePreference') ?? 'auto',
  ) as ThemePreference

  const setThemePreference = useCallback(
    (theme: ThemePreference) => {
      dispatch(updateSettings({ themePreference: theme }))
    },
    [dispatch],
  )

  // Prevent theme from changing when the app is in the background
  // Issue: https://github.com/facebook/react-native/issues/35972
  // They closed but issue still exists. Check the link for more details.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setTheme(themePreference === 'auto' ? colorScheme : themePreference)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [colorScheme, themePreference])

  return { themePreference, setThemePreference, currentTheme }
}
