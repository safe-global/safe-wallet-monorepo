import React from 'react'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { LedgerPairing } from '@/src/features/Ledger/components/LedgerPairing'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const LedgerPairingExecuteContainer = () => {
  const { bottom } = useSafeAreaInsets()
  const navigationConfig = {
    pathname: '/execute-transaction/ledger-review',
    getParams: (device: DiscoveredDevice, sessionId: string, searchParams?: Record<string, string>) => ({
      deviceName: device.name,
      sessionId,
      txId: searchParams?.txId || '',
      executionMethod: searchParams?.executionMethod || '',
    }),
  }

  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <LedgerPairing navigationConfig={navigationConfig} />
    </View>
  )
}
