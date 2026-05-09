import React from 'react'
import { ThemeProvider } from '@react-navigation/native'
import { TamaguiProvider } from '@tamagui/core'
import { config } from '@/src/theme/tamagui.config'
import { NavDarkTheme, NavLightTheme } from '@/src/theme/navigation'
import { FontProvider } from '@/src/theme/provider/font'
import { View } from 'tamagui'

interface StorybookThemeProviderProps {
  children: React.ReactNode
  theme?: 'light' | 'dark'
}

export const StorybookThemeProvider = ({ children, theme = 'light' }: StorybookThemeProviderProps) => {
  const isDark = theme === 'dark'

  return (
    <FontProvider>
      <TamaguiProvider config={config} defaultTheme={theme}>
        <ThemeProvider value={isDark ? NavDarkTheme : NavLightTheme}>
          <View
            backgroundColor={isDark ? NavDarkTheme.colors.background : NavLightTheme.colors.background}
            style={{ flex: 1 }}
          >
            {children}
          </View>
        </ThemeProvider>
      </TamaguiProvider>
    </FontProvider>
  )
}
