import React, { useEffect } from 'react'
import { useFonts } from 'expo-font'
import DmSansSemiBold from '@tamagui/font-dm-sans/fonts/static/DMSans-SemiBold.ttf'
import DmSansRegular from '@tamagui/font-dm-sans/fonts/static/DMSans-Regular.ttf'
import DmSansMedium from '@tamagui/font-dm-sans/fonts/static/DMSans-Medium.ttf'
import DmSansMediumItalic from '@tamagui/font-dm-sans/fonts/static/DMSans-MediumItalic.ttf'
import DmSansSemiBoldItalic from '@tamagui/font-dm-sans/fonts/static/DMSans-SemiBoldItalic.ttf'
import DmSansBold from '@tamagui/font-dm-sans/fonts/static/DMSans-Bold.ttf'
import DmSansBoldItalic from '@tamagui/font-dm-sans/fonts/static/DMSans-BoldItalic.ttf'
import * as SplashScreen from 'expo-splash-screen'

interface SafeThemeProviderProps {
  children: React.ReactNode
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
})

export const FontProvider = ({ children }: SafeThemeProviderProps) => {
  const [loaded] = useFonts({
    'DMSans-SemiBold': DmSansSemiBold,
    'DMSans-Regular': DmSansRegular,
    'DMSans-Medium': DmSansMedium,
    'DMSans-MediumItalic': DmSansMediumItalic,
    'DMSans-SemiBoldItalic': DmSansSemiBoldItalic,
    'DMSans-Bold': DmSansBold,
    'DMSans-BoldItalic': DmSansBoldItalic,
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return children
}
