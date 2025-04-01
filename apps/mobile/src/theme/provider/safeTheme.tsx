import React from 'react'
import { StatusBar } from 'react-native'
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
