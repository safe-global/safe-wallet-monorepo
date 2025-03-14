import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ImportSuccess } from '@/src/features/ImportPrivateKey/components/ImportSuccess'
import React from 'react'
import { useModalStyle } from '@/src/navigation/hooks/useModalStyle'
import { useTheme, View } from 'tamagui'

export default function ImportPrivateKeySuccess() {
  const modalStyle = useModalStyle()
  const theme = useTheme()
  const colors: [string, string] = [theme.success.get(), 'transparent']

  return (
    <View style={modalStyle}>
      <LinearGradient colors={colors} style={styles.background} />

      <ImportSuccess />
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
