import React from 'react'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { LedgerConnect } from '@/src/features/Ledger/components/LedgerConnect'

export const LedgerConnectExecuteContainer = () => {
  const navigationConfig = {
    pathname: '/execute-transaction/ledger-pairing',
    getParams: (device: DiscoveredDevice, searchParams?: Record<string, string>) => ({
      deviceData: JSON.stringify(device),
      txId: searchParams?.txId || '',
      executionMethod: searchParams?.executionMethod || '',
    }),
  }

  return <LedgerConnect navigationConfig={navigationConfig} />
}
