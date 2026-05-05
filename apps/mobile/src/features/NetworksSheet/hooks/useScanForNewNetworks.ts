import { useCallback, useMemo, useState } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { selectCurrency } from '@/src/store/settingsSlice'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { useLazySafeOverviews } from '@/src/hooks/services/useLazySafeOverviews'
import { makeSafeId } from '@/src/utils/formatters'
import { trackEvent } from '@/src/services/analytics'
import { createScanForNewNetworksEvent } from '@/src/services/analytics/events/overview'
import type { Address } from '@/src/types/address'
import type { RootState } from '@/src/store'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import Logger from '@/src/utils/logger'

export type ScanPhase = 'idle' | 'scanning' | 'error'

export type LastScanResult = {
  newChainIds: string[]
  scannedAt: number
}

export type UseScanForNewNetworksResult = {
  scan: () => Promise<void>
  phase: ScanPhase
  lastResult: LastScanResult | null
  errorMessage: string | null
  isPressable: boolean
}

/**
 * Drives the explicit "Scan for new networks" action on the network selector sheet.
 *
 * Reads the safe's currently known chain set, fires a single chunked
 * `useLazySafeOverviews` call across every supported chain, and computes
 * "newly discovered" chain ids from the awaited query payload — *not* by
 * diffing slice state before/after, which would couple to extraReducers timing.
 *
 * The slice (`safesSlice.extraReducers`) still merges the response automatically;
 * this hook just doesn't rely on observing that merge.
 */
export const useScanForNewNetworks = (safeAddress: Address): UseScanForNewNetworksResult => {
  const allChainIds = useAppSelector(selectAllChainsIds)
  const currency = useAppSelector(selectCurrency)
  const safeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, safeAddress))
  const knownChainIds = useMemo(() => Object.keys(safeInfo ?? {}), [safeInfo])

  const [trigger] = useLazySafeOverviews()
  const [phase, setPhase] = useState<ScanPhase>('idle')
  const [lastResult, setLastResult] = useState<LastScanResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const scan = useCallback(async () => {
    if (phase === 'scanning' || allChainIds.length === 0) {
      return
    }

    setPhase('scanning')
    setErrorMessage(null)

    const known = new Set(knownChainIds)

    try {
      const result = await trigger(
        {
          safes: allChainIds.map((chainId) => makeSafeId(chainId, safeAddress)),
          currency,
          trusted: true,
        },
        false,
      ).unwrap()

      const overviews = (result ?? []) as SafeOverview[]
      const newChainIds = overviews.map((o) => o.chainId).filter((id) => !known.has(id))

      const scanResult: LastScanResult = { newChainIds, scannedAt: Date.now() }
      setLastResult(scanResult)
      setPhase('idle')

      void trackEvent(createScanForNewNetworksEvent(newChainIds.length > 0 ? 'success' : 'empty', newChainIds.length))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to scan for new networks'
      setErrorMessage(message)
      setPhase('error')
      Logger.error('Scan for new networks failed', err)

      void trackEvent(createScanForNewNetworksEvent('error', 0))
    }
  }, [phase, allChainIds, knownChainIds, currency, safeAddress, trigger])

  const isPressable = phase !== 'scanning'

  return { scan, phase, lastResult, errorMessage, isPressable }
}
