import React from 'react'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LedgerIntroContainer } from '@/src/features/Ledger'

export default function HardwareDevicesPage() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View style={{ flex: 1 }} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <LedgerIntroContainer />
    </View>
  )
}
