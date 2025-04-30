import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ImportSuccess } from '@/src/features/ImportPrivateKey/components/ImportSuccess'
import React from 'react'
import { useTheme, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ImportPrivateKeySuccess() {
  const theme = useTheme()
  const colors: [string, string] = [theme.success.get(), 'transparent']
  const { bottom } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1 }} paddingBottom={bottom}>
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
