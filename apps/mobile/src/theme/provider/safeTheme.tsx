import React from 'react'
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
  const { colorScheme, isDark } = useTheme()

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
        {themeProvider}
      </TamaguiProvider>
    </FontProvider>
  )
}
