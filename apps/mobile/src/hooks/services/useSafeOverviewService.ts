import { SafeOverviewResult } from '@safe-global/store/gateway/types'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useMemo } from 'react'
import { makeSafeId } from '@/src/utils/formatters'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { selectCurrency } from '@/src/store/settingsSlice'

export const useSafeOverviewService = (safeAddress?: string) => {
  const chainIds = useAppSelector(selectAllChainsIds)
  const currency = useAppSelector(selectCurrency)
  const safes = useMemo(
    () => (safeAddress ? chainIds.map((chainId: string) => makeSafeId(chainId, safeAddress)) : []),
    [chainIds, safeAddress],
  )

  const { data } = useSafesGetOverviewForManyQuery<SafeOverviewResult>(
    {
      safes,
      currency,
      trusted: true,
      excludeSpam: true,
    },
    {
      skip: !safeAddress,
    },
  )

  return data
}
