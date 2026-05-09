import React from 'react'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { LedgerPairing } from '@/src/features/Ledger/components/LedgerPairing'

export const LedgerPairingSignContainer = () => {
  const navigationConfig = {
    pathname: '/sign-transaction/ledger-review',
    getParams: (device: DiscoveredDevice, sessionId: string, searchParams?: Record<string, string>) => ({
      deviceName: device.name,
      sessionId,
      txId: searchParams?.txId || '',
    }),
  }

  return <LedgerPairing navigationConfig={navigationConfig} />
}
