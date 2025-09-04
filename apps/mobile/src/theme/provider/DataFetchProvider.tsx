import React from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains } from '@/src/store/chains'
import { makeSafeId } from '@/src/utils/formatters'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { SafeOverviewResult } from '@safe-global/store/gateway/types'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectCurrency } from '@/src/store/settingsSlice'

export const DataFetchProvider = ({ children }: { children: React.ReactNode }) => {
  const chains = useAppSelector(selectAllChains)
  const activeSafe = useAppSelector(selectActiveSafe)
  const currency = useAppSelector(selectCurrency)
  useSafesGetOverviewForManyQuery<SafeOverviewResult>(
    {
      safes: activeSafe ? chains.map((chain) => makeSafeId(chain.chainId, activeSafe.address)) : [],
      currency,
      trusted: true,
      excludeSpam: true,
    },
    {
      skip: chains.length === 0 && !!activeSafe,
    },
  )

  return children
}
