import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { LedgerImportError } from '@/src/features/Ledger/components/LedgerImportError'
import React from 'react'
import { getTokenValue, useTheme, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function LedgerErrorPage() {
  const theme = useTheme()
  const colors: [string, string] = [theme.errorDark.get(), 'transparent']
  const { bottom } = useSafeAreaInsets()
  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <LinearGradient colors={colors} style={styles.background} />

      <LedgerImportError />
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
