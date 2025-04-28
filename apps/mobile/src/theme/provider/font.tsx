import React, { useEffect, useState } from 'react'
import { useFonts } from 'expo-font'
import DmSansSemiBold from '@tamagui/font-dm-sans/fonts/static/DMSans-SemiBold.ttf'
import DmSansRegular from '@tamagui/font-dm-sans/fonts/static/DMSans-Regular.ttf'
import DmSansMedium from '@tamagui/font-dm-sans/fonts/static/DMSans-Medium.ttf'
import DmSansMediumItalic from '@tamagui/font-dm-sans/fonts/static/DMSans-MediumItalic.ttf'
import DmSansSemiBoldItalic from '@tamagui/font-dm-sans/fonts/static/DMSans-SemiBoldItalic.ttf'
import DmSansBold from '@tamagui/font-dm-sans/fonts/static/DMSans-Bold.ttf'
import DmSansBoldItalic from '@tamagui/font-dm-sans/fonts/static/DMSans-BoldItalic.ttf'
import * as SplashScreen from 'expo-splash-screen'
import { Animated, StyleSheet, Image, Platform } from 'react-native'

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

  const [showCustomSplash, setShowCustomSplash] = useState(true)
  const fadeAnim = React.useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (loaded) {
      if (Platform.OS === 'android') {
        // On Android, fade out our custom splash and then hide the native one
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowCustomSplash(false)
          SplashScreen.hideAsync()
        })
      } else {
        // On iOS, just hide the native splash screen
        SplashScreen.hideAsync()
      }
    }
  }, [loaded, fadeAnim])

  if (!loaded) {
    return null
  }

  return (
    <>
      {Platform.OS === 'android' && showCustomSplash && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.customSplash, { opacity: fadeAnim }]}>
          <Image
            source={require('../../../assets/images/splash.png')}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </Animated.View>
      )}
      {children}
    </>
  )
}

const styles = StyleSheet.create({
  customSplash: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
})
