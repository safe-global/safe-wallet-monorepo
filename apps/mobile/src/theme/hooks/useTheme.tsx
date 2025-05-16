import { useCallback, useEffect } from 'react'
import { AppState, useColorScheme } from 'react-native'
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

  // Prevent theme from changing when the app is in the background
  // Issue: https://github.com/facebook/react-native/issues/35972
  // They closed but issue still exists. Check the link for more details.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        dispatch(updateSettings({ themePreference }))
      }
    })

    return () => {
      subscription.remove()
    }
  }, [themePreference])

  return {
    themePreference,
    setThemePreference,
    currentTheme: themePreference === 'auto' ? colorScheme : themePreference,
  }
}
