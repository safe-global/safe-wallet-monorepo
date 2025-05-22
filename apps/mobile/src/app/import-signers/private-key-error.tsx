import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ImportError } from '@/src/features/ImportPrivateKey/components/ImportError'
import React from 'react'
import { useTheme, View } from 'tamagui'

export default function App() {
  const theme = useTheme()
  const colors: [string, string] = [theme.errorDark.get(), 'transparent']

  return (
    <View style={{ flex: 1 }}>
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
  },
})
