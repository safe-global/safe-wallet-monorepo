import React, { useCallback, useMemo } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { ThemeProvider } from '@react-navigation/native'
import { TamaguiProvider } from '@tamagui/core'

import { config } from '@/src/theme/tamagui.config'
import { NavDarkTheme, NavLightTheme } from '@/src/theme/navigation'
import { FontProvider } from '@/src/theme/provider/font'
import { isStorybookEnv } from '@/src/config/constants'
import { View } from 'tamagui'
import { updateSettings } from '@/src/store/settingsSlice'
import { selectSettings } from '@/src/store/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { ThemePreference } from '@/src/types/theme'

interface SafeThemeProviderProps {
  children: React.ReactNode
}

export const SafeThemeProvider = ({ children }: SafeThemeProviderProps) => {
  const { currentTheme } = useTheme()

  const themeProvider = isStorybookEnv ? (
    <View
      backgroundColor={currentTheme === 'dark' ? NavDarkTheme.colors.background : NavLightTheme.colors.background}
      style={{ flex: 1 }}
    >
      {children}
    </View>
  ) : (
    <ThemeProvider value={currentTheme === 'dark' ? NavDarkTheme : NavLightTheme}>{children}</ThemeProvider>
  )

  return (
    <FontProvider>
      <StatusBar animated={true} barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <TamaguiProvider config={config} defaultTheme={currentTheme ?? 'light'}>
        {themeProvider}
      </TamaguiProvider>
    </FontProvider>
  )
}

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
