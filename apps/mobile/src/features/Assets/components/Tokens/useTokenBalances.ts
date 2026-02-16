import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { skipToken } from '@reduxjs/toolkit/query'

import { DUST_THRESHOLD, POLLING_INTERVAL } from '@/src/config/constants'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { type Balance, useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency, selectHideDust, selectTokenList, TOKEN_LISTS } from '@/src/store/settingsSlice'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { FEATURES } from '@safe-global/utils/utils/chains'

function filterDustTokens(items: Balance[] | undefined, shouldFilter: boolean): Balance[] | undefined {
  if (!items) {
    return
  }
  if (!shouldFilter) {
    return items
  }
  return items.filter((item) => Number(item.fiatBalance) >= DUST_THRESHOLD)
}

export function useTokenBalances() {
  const activeSafe = useSelector(selectActiveSafe)
  const currency = useAppSelector(selectCurrency)
  const tokenList = useAppSelector(selectTokenList)
  const hideDust = useAppSelector(selectHideDust)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)

  const trusted = hasDefaultTokenlist && tokenList === TOKEN_LISTS.TRUSTED
  const shouldFilterDust = Boolean(hideDust && hasDefaultTokenlist)

  const { data, isFetching, error, isLoading, refetch } = useBalancesGetBalancesV1Query(
    !activeSafe
      ? skipToken
      : {
          chainId: activeSafe.chainId,
          fiatCode: currency,
          safeAddress: activeSafe.address,
          trusted,
        },
    {
      pollingInterval: POLLING_INTERVAL,
    },
  )

  const items = data?.items
  const visibleItems = useMemo(() => filterDustTokens(items, shouldFilterDust), [items, shouldFilterDust])

  const allFilteredByDust = shouldFilterDust && items && items.length > 0 && visibleItems?.length === 0

  return {
    visibleItems,
    currency,
    isFetching,
    error,
    isLoading,
    hasItems: Boolean(items?.length),
    allFilteredByDust: Boolean(allFilteredByDust),
    refetch,
  }
}
