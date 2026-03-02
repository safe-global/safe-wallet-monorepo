import { useMemo } from 'react'

import { DUST_THRESHOLD } from '@/src/config/constants'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency, selectHideDust } from '@/src/store/settingsSlice'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useMobileTotalBalances from '@/src/hooks/useTotalBalances'

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
  const currency = useAppSelector(selectCurrency)
  const hideDust = useAppSelector(selectHideDust)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)

  const { data, isFetching, error, loading, refetch } = useMobileTotalBalances()

  const shouldFilterDust = Boolean(hideDust && hasDefaultTokenlist)

  const items = data?.items
  const visibleItems = useMemo(() => filterDustTokens(items, shouldFilterDust), [items, shouldFilterDust])

  const allFilteredByDust = shouldFilterDust && items && items.length > 0 && visibleItems?.length === 0

  return {
    visibleItems,
    currency,
    isFetching,
    error,
    isLoading: loading,
    hasItems: Boolean(items?.length),
    allFilteredByDust: Boolean(allFilteredByDust),
    refetch,
  }
}
