import { useMemo } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectCurrency } from '@/src/store/settingsSlice'
import { makeSafeId } from '@/src/utils/formatters'
import { useSafeOverviewsQuery } from '@/src/hooks/services/useSafeOverviewsQuery'
import type { Address } from '@/src/types/address'
import type { RootState } from '@/src/store'

type Options = {
  pollingInterval?: number
}

/**
 * Refresh balances for a single safe across the chains it is already known to be
 * deployed on. Probes only known chains — discovery of new chain deployments stays
 * behind the explicit "Scan for new networks" action on the network selector sheet.
 *
 * Mount per row (e.g. inside a FlatList renderItem) so the work scales with
 * viewport, not with library size: a user with 50 imported safes who only scrolls
 * to the top 5 only fans out 5 requests, not 50.
 */
export const useSafeKnownChainsOverview = (safeAddress: Address | undefined, options?: Options) => {
  const safeInfo = useAppSelector((state: RootState) => (safeAddress ? selectSafeInfo(state, safeAddress) : undefined))
  const knownChainIds = useMemo(() => Object.keys(safeInfo ?? {}), [safeInfo])
  const currency = useAppSelector(selectCurrency)

  return useSafeOverviewsQuery(
    {
      safes: safeAddress ? knownChainIds.map((chainId) => makeSafeId(chainId, safeAddress)) : [],
      currency,
      trusted: true,
      excludeSpam: true,
    },
    {
      pollingInterval: options?.pollingInterval,
      skip: !safeAddress || knownChainIds.length === 0,
    },
  )
}
