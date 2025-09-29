import React from 'react'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { LedgerPairing } from '@/src/features/Ledger/components/LedgerPairing'

export const LedgerPairingContainer = () => {
  const navigationConfig = {
    pathname: '/import-signers/ledger-addresses',
    getParams: (device: DiscoveredDevice, sessionId: string) => ({
      deviceName: device.name,
      sessionId,
    }),
  }

  return <LedgerPairing navigationConfig={navigationConfig} />
}
