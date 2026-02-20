import { Balance } from './Balance'
import { makeSafeId } from '@/src/utils/formatters'
import { useAppSelector } from '@/src/store/hooks'
import React from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectCurrency } from '@/src/store/settingsSlice'
import { POLLING_INTERVAL } from '@/src/config/constants'
import { useSafeOverviewsQuery } from '@/src/hooks/services/useSafeOverviewsQuery'

export function BalanceContainer() {
  const activeSafe = useDefinedActiveSafe()
  const currency = useAppSelector(selectCurrency)
  const { data, isLoading } = useSafeOverviewsQuery(
    {
      safes: [makeSafeId(activeSafe.chainId, activeSafe.address)],
      currency,
      trusted: true,
      excludeSpam: true,
    },
    {
      pollingInterval: POLLING_INTERVAL,
    },
  )
  const balance = data?.find((chain) => chain.chainId === activeSafe.chainId)

  return <Balance isLoading={isLoading} balanceAmount={balance?.fiatTotal || ''} />
}
