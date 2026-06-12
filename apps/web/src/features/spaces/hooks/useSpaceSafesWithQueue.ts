import { useMemo } from 'react'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { selectCurrency } from '@/store/settingsSlice'

type SafePair = { chainId: string; address: string }

export const useSpaceSafesWithQueue = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const currency = useAppSelector(selectCurrency)

  const { currentData: spaceSafes, isFetching: isLoadingSafes } = useSpaceSafesGetV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId },
  )

  const safeIds = useMemo(() => {
    if (!spaceSafes?.safes) return []
    return Object.entries(spaceSafes.safes).flatMap(([chainId, addresses]: [string, string[]]) =>
      addresses.map((address) => `${chainId}:${address}`),
    )
  }, [spaceSafes?.safes])

  const { currentData: overviews, isLoading: isLoadingOverviews } = useSafesGetOverviewForManyQuery(
    { currency, safes: safeIds, trusted: true },
    { skip: safeIds.length === 0 },
  )

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
