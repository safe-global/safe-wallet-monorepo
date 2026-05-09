import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View } from 'tamagui'
import { LedgerConnectContainer } from '@/src/features/Ledger'

export default function LedgerConnectPage() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View style={{ flex: 1 }} paddingBottom={bottom}>
      <LedgerConnectContainer />
    </View>
  )
}
