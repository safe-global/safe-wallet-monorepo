import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { getWalletKit } from '../walletKit'
import { getPairErrorMessage, logWalletKitError } from '../utils/errors'
import { PAIR_TIMEOUT_MESSAGE, PAIR_TIMEOUT_MS } from '../utils/constants'
import { WalletConnectManualEntry } from './WalletConnectManualEntry'

export function WalletConnectManualEntryContainer() {
  const router = useRouter()
  const [isPairing, setIsPairing] = useState(false)
  const [pairError, setPairError] = useState<string | undefined>()

  const onPair = async (uri: string) => {
    setIsPairing(true)
    setPairError(undefined)
    // The Pair button is disabled while `isPairing`, so only one attempt runs at a time —
    // a per-attempt `cancelled` flag is enough to make a late resolve after timeout a no-op.
    let cancelled = false
    const timer = setTimeout(() => {
      cancelled = true
      setPairError(PAIR_TIMEOUT_MESSAGE)
      setIsPairing(false)
    }, PAIR_TIMEOUT_MS)
    try {
      const wk = await getWalletKit()
      await wk.pair({ uri })
      if (cancelled) {
        return
      }
      clearTimeout(timer)
      // Dismiss both screens this was reached through — the manual-entry screen and the QR
      // scanner it was pushed from — so the proposal (surfaced by the global RequestSheetHost)
      // shows over the screen below.
      router.dismiss(2)
    } catch (e) {
      if (cancelled) {
        return
      }
      clearTimeout(timer)
      logWalletKitError('manual pair failed', e)
      setPairError(getPairErrorMessage(e))
      setIsPairing(false)
    }
  }

  return <WalletConnectManualEntry onPair={onPair} isPairing={isPairing} pairError={pairError} />
}
