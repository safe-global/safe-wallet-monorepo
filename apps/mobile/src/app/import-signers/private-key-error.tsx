import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ImportError } from '@/src/features/ImportPrivateKey/components/ImportError'
import React from 'react'
import { View } from 'tamagui'
import { useModalStyle } from '@/src/navigation/hooks/useModalStyle'

const colors: [string, string] = ['#221818', 'transparent']

export default function App() {
  const modalStyle = useModalStyle()

  return (
    <View style={modalStyle}>
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
