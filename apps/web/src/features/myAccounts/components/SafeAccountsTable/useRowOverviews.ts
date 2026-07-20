import { useEffect, useMemo, useRef } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SafeItem } from '@/hooks/safes'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { selectUndeployedSafes } from '@/features/counterfactual/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useAppSelector } from '@/store'
import useWallet from '@/hooks/wallets/useWallet'
import useOnceVisible from '@/hooks/useOnceVisible'

/**
 * Fetches a row's Safe overview(s) only once the row scrolls into view, reporting the result via
 * `onLoaded`. Undeployed safes are skipped (no overview). Returns the ref to attach to the row.
 */
export function useRowOverviews(safes: SafeItem[], enabled: boolean, onLoaded: (overviews: SafeOverview[]) => void) {
  const ref = useRef<HTMLElement | null>(null)
  const isVisible = useOnceVisible(ref)
  const currency = useAppSelector(selectCurrency)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const { address: walletAddress } = useWallet() || {}

  const deployedSafes = useMemo(
    () => safes.filter((safe) => !undeployedSafes[safe.chainId]?.[safe.address]),
    [safes, undeployedSafes],
  )

  const active = enabled && isVisible && deployedSafes.length > 0

  const { data } = useGetMultipleSafeOverviewsQuery(
    active ? { currency, walletAddress, safes: deployedSafes } : skipToken,
  )

  // Reporting keys off `data` alone (via a ref for the callback), so a genuine load/refetch fires it
  // exactly once no matter how `onLoaded` is passed — the correctness can't be broken by a caller.
  const onLoadedRef = useRef(onLoaded)
  onLoadedRef.current = onLoaded
  useEffect(() => {
    if (data && data.length > 0) onLoadedRef.current(data)
  }, [data])

  return ref
}
