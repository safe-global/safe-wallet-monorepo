import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { selectCurrency } from '@/store/settingsSlice'
import { flattenSafeItems } from '@/hooks/safes'
import { useSpaceSafes } from './useSpaceSafes'

type SafePair = { chainId: string; address: string }

export const useSpaceSafesWithQueue = () => {
  const { allSafes, isLoading: isLoadingSafes } = useSpaceSafes()
  const currency = useAppSelector(selectCurrency)

  // Same args as AggregatedBalance so both subscribe to the same cache entry —
  // the dashboard then only fetches overviews once.
  const safeItems = useMemo(() => flattenSafeItems(allSafes), [allSafes])
  const { data: overviews, isLoading: isLoadingOverviews } = useGetMultipleSafeOverviewsQuery({
    safes: safeItems,
    currency,
  })

  const safesWithQueue = useMemo(() => {
    if (!overviews) return []

    return overviews.reduce<SafePair[]>((result, overview) => {
      if (overview.queued > 0) {
        result.push({ chainId: overview.chainId, address: overview.address.value })
      }
      return result
    }, [])
  }, [overviews])

  return {
    safesWithQueue,
    isLoading: isLoadingSafes || isLoadingOverviews,
  }
}
