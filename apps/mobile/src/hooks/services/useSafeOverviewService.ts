import { SafeOverviewResult } from '@safe-global/store/gateway/types'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useMemo } from 'react'
import { makeSafeId } from '@/src/utils/formatters'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'

export const useSafeOverviewService = (safeAddress: string) => {
  const chainIds = useAppSelector(selectAllChainsIds)
  const safes = useMemo(
    () => chainIds.map((chainId: string) => makeSafeId(chainId, safeAddress)),
    [chainIds, safeAddress],
  )

  const { data } = useSafesGetOverviewForManyQuery<SafeOverviewResult>({
    safes,
    currency: 'usd',
    trusted: true,
    excludeSpam: true,
  })

  return data
}
