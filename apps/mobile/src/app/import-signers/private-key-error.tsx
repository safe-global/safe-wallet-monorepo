import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ImportError } from '@/src/features/ImportPrivateKey/components/ImportError'
import React from 'react'
import { getTokenValue, useTheme, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function App() {
  const theme = useTheme()
  const colors: [string, string] = [theme.errorDark.get(), 'transparent']
  const { bottom } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1 }} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <LinearGradient colors={colors} style={styles.background} />

      <ImportError />
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
    opacity: 0.1,
  },
})
