import React, { createContext, useContext, useMemo, useCallback } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { ThemeProvider } from '@react-navigation/native'
import { TamaguiProvider } from '@tamagui/core'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectSettings, updateSettings } from '@/src/store/settingsSlice'

import { config } from '@/src/theme/tamagui.config'
import { NavDarkTheme, NavLightTheme } from '@/src/theme/navigation'
import { FontProvider } from '@/src/theme/provider/font'
import { isStorybookEnv } from '@/src/config/constants'
import { View } from 'tamagui'
import { ThemePreference } from '@/src/types/theme'

interface ThemeContextValue {
  themePreference: ThemePreference
  setThemePreference: (theme: ThemePreference) => void
  currentTheme: ThemePreference
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
  const dispatch = useAppDispatch()
  const systemColorScheme = useColorScheme()
  const themePreference = useAppSelector((state) => selectSettings(state, 'themePreference'))

  console.log('themePreference :: ', themePreference)
  const setThemePreference = useCallback(
    (theme: ThemePreference) => {
      dispatch(updateSettings({ themePreference: theme }))
    },
    [dispatch],
  )

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
      themePreference: themePreference as ThemePreference,
      setThemePreference,
      currentTheme: currentTheme as ThemePreference,
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
