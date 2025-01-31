import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ImportSuccess } from '@/src/features/ImportPrivateKey/components/ImportSuccess'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const colors: [string, string] = ['#0b301c', 'transparent']

export default function ImportPrivateKeySuccess() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <LinearGradient colors={colors} style={styles.background} />

      <ImportSuccess />
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
