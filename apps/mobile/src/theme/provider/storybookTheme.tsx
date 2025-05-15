import React from 'react'
import { ThemeProvider } from '@react-navigation/native'
import { TamaguiProvider } from '@tamagui/core'
import { config } from '@/src/theme/tamagui.config'
import { NavDarkTheme, NavLightTheme } from '@/src/theme/navigation'
import { FontProvider } from '@/src/theme/provider/font'
import { View } from 'tamagui'
import { useColorScheme } from 'react-native'

interface StorybookThemeProviderProps {
  children: React.ReactNode
}

export const StorybookThemeProvider = ({ children }: StorybookThemeProviderProps) => {
  const colorScheme = useColorScheme()

  return (
    <FontProvider>
      <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
        <ThemeProvider value={colorScheme === 'dark' ? NavDarkTheme : NavLightTheme}>
          <View
            backgroundColor={colorScheme === 'dark' ? NavDarkTheme.colors.background : NavLightTheme.colors.background}
            style={{ flex: 1 }}
          >
            {children}
          </View>
        </ThemeProvider>
      </TamaguiProvider>
    </FontProvider>
  )
}
