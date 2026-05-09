import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View } from 'tamagui'
import { LedgerPairingContainer } from '@/src/features/Ledger'

export default function LedgerPairingPage() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View style={{ flex: 1 }} paddingBottom={bottom}>
      <LedgerPairingContainer />
    </View>
  )
}
