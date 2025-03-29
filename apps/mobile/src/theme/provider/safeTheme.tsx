import React, { createContext, useContext, useState, useMemo } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { ThemeProvider } from '@react-navigation/native'
import { TamaguiProvider } from '@tamagui/core'

import { config } from '@/src/theme/tamagui.config'
import { NavDarkTheme, NavLightTheme } from '@/src/theme/navigation'
import { FontProvider } from '@/src/theme/provider/font'
import { isStorybookEnv } from '@/src/config/constants'
import { View } from 'tamagui'

export type ThemePreference = 'light' | 'dark' | 'auto'

interface ThemeContextValue {
  themePreference: ThemePreference
  setThemePreference: (theme: ThemePreference) => void
  currentTheme: 'light' | 'dark' | 'auto'
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within SafeThemeProvider')
  }
  return context
}

interface SafeThemeProviderProps {
  children: React.ReactNode
}

export const SafeThemeProvider = ({ children }: SafeThemeProviderProps) => {
  const systemColorScheme = useColorScheme()
  const [themePreference, setThemePreference] = useState<ThemePreference>('auto')

  // Use useMemo to compute the current theme instead of state
  const currentTheme = useMemo(() => {
    return themePreference === 'auto' ? systemColorScheme || 'dark' : themePreference
  }, [themePreference, systemColorScheme])

  // Memoize the theme provider to prevent unnecessary re-renders
  const themeProvider = useMemo(() => {
    return isStorybookEnv ? (
      <View
        backgroundColor={currentTheme === 'dark' ? NavDarkTheme.colors.background : NavLightTheme.colors.background}
        style={{ flex: 1 }}
      >
        {children}
      </View>
    ) : (
      <ThemeProvider value={currentTheme === 'dark' ? NavDarkTheme : NavLightTheme}>{children}</ThemeProvider>
    )
  }, [currentTheme, children])

  const contextValue = useMemo(
    () => ({
      themePreference,
      setThemePreference,
      currentTheme,
    }),
    [themePreference, currentTheme],
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      <FontProvider>
        <StatusBar
          animated={true}
          barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />

        <TamaguiProvider config={config} defaultTheme={currentTheme}>
          {themeProvider}
        </TamaguiProvider>
      </FontProvider>
    </ThemeContext.Provider>
  )
}
