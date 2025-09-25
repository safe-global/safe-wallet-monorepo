import React from 'react'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { LedgerConnect } from '@/src/features/Ledger/components/LedgerConnect'

export const LedgerConnectContainer = () => {
  const navigationConfig = {
    pathname: '/import-signers/ledger-pairing',
    getParams: (device: DiscoveredDevice) => ({
      deviceData: JSON.stringify(device),
    }),
  }

  return <LedgerConnect navigationConfig={navigationConfig} />
}
