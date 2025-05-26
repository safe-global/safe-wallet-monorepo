import React from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains } from '@/src/store/chains'
import { makeSafeId } from '@/src/utils/formatters'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { SafeOverviewResult } from '@safe-global/store/gateway/types'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'

export const DataFetchProvider = ({ children }: { children: React.ReactNode }) => {
  const chains = useAppSelector(selectAllChains)
  const activeSafe = useAppSelector(selectActiveSafe)

  useSafesGetOverviewForManyQuery<SafeOverviewResult>(
    {
      safes: activeSafe ? chains.map((chain) => makeSafeId(chain.chainId, activeSafe.address)) : [],
      currency: 'usd',
      trusted: true,
      excludeSpam: true,
    },
    {
      skip: chains.length === 0 && !!activeSafe,
    },
  )

  return children
}
