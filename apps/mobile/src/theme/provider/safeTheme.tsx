import React, { useEffect } from 'react'
import { Appearance } from 'react-native'
import { ThemeProvider } from '@react-navigation/native'
import { TamaguiProvider } from '@tamagui/core'

import { config } from '@/src/theme/tamagui.config'
import { NavDarkTheme, NavLightTheme } from '@/src/theme/navigation'
import { FontProvider } from '@/src/theme/provider/font'
import { isStorybookEnv } from '@/src/config/constants'
import { View } from 'tamagui'
import { useTheme } from '../hooks/useTheme'

interface SafeThemeProviderProps {
  children: React.ReactNode
}

export const SafeThemeProvider = ({ children }: SafeThemeProviderProps) => {
  const { colorScheme, isDark, themePreference } = useTheme()

  // Sync native iOS appearance with the app theme so native components
  // (RefreshControl, context menus, etc.) match the app's color scheme.
  // In auto mode, pass null to let the OS control the appearance.
  useEffect(() => {
    Appearance.setColorScheme(themePreference === 'auto' ? null : (colorScheme ?? null))
  }, [colorScheme, themePreference])

  const themeProvider = isStorybookEnv ? (
    <View
      backgroundColor={isDark ? NavDarkTheme.colors.background : NavLightTheme.colors.background}
      style={{ flex: 1 }}
    >
      {children}
    </View>
  ) : (
    <ThemeProvider value={isDark ? NavDarkTheme : NavLightTheme}>{children}</ThemeProvider>
  )

  return (
    <FontProvider>
      <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
        <View testID={`theme-${colorScheme ?? 'light'}`} style={{ flex: 1 }}>
          {themeProvider}
        </View>
      </TamaguiProvider>
    </FontProvider>
  )
}
