import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { getWalletKit } from '../walletKit'
import { logWalletKitError } from '../utils/errors'
import { WalletConnectManualEntry } from './WalletConnectManualEntry'

export function WalletConnectManualEntryContainer() {
  const router = useRouter()
  const [isPairing, setIsPairing] = useState(false)
  const [pairError, setPairError] = useState<string | undefined>()

  const onPair = async (uri: string) => {
    setIsPairing(true)
    setPairError(undefined)
    try {
      const wk = await getWalletKit()
      await wk.pair({ uri })
      // Pop twice: first the manual-entry screen, then the QR scanner it was pushed from,
      // so the proposal (surfaced by the global RequestSheetHost) shows over the screen below.
      router.back()
      router.back()
    } catch (e) {
      logWalletKitError('manual pair failed', e)
      setPairError(e instanceof Error ? e.message : 'Failed to pair')
      setIsPairing(false)
    }
  }

  return <WalletConnectManualEntry onPair={onPair} isPairing={isPairing} pairError={pairError} />
}
