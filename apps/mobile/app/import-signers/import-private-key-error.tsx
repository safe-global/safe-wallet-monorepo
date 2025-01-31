import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ImportError } from '@/src/features/ImportPrivateKey/components/ImportError'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const colors: [string, string] = ['#221818', 'transparent']

export default function App() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <LinearGradient colors={colors} style={styles.background} />

      <ImportError />
    </SafeAreaView>
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
