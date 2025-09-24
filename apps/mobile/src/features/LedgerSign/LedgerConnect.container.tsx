import React from 'react'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { LedgerConnect } from '@/src/features/Ledger/components/LedgerConnect'

export const LedgerConnectSignContainer = () => {
  const navigationConfig = {
    pathname: '/sign-transaction/ledger-pairing',
    getParams: (device: DiscoveredDevice, searchParams?: Record<string, string>) => ({
      deviceData: JSON.stringify(device),
      txId: searchParams?.txId || '',
    }),
  }

  return <LedgerConnect navigationConfig={navigationConfig} />
}
