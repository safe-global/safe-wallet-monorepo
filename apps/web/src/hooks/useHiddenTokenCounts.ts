import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectCurrency, selectHideDust, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useHasFeature } from './useChains'
import useSafeInfo from './useSafeInfo'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { DUST_THRESHOLD } from '@/config/constants'
import useBalances from './useBalances'
import useHiddenTokens from './useHiddenTokens'

export interface HiddenTokenCounts {
  hiddenByTokenList: number
  hiddenByDustFilter: number
}

const filterDustTokens = (items: ReturnType<typeof useBalances>['balances']['items'], hideDust: boolean) => {
  if (!hideDust) return items
  return items.filter((balanceItem) => Number(balanceItem.fiatBalance) >= DUST_THRESHOLD)
}

export const useHiddenTokenCounts = (): HiddenTokenCounts => {
  const { balances: currentBalances } = useBalances()
  const hiddenTokens = useHiddenTokens()
  const hideDust = useAppSelector(selectHideDust)
  const settings = useAppSelector(selectSettings)
  const hasPortfolioFeature = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false
  const isAllTokensSelected = settings.tokenList === TOKEN_LISTS.ALL
  const currency = useAppSelector(selectCurrency)
  const { safe, safeAddress } = useSafeInfo()
  const isReady = safeAddress && safe.deployed

  const shouldFetchAllTokens = hasPortfolioFeature && !isAllTokensSelected

  const { currentData: allTokensBalances, isLoading: allTokensLoading } = useBalancesGetBalancesV1Query(
    {
      chainId: safe.chainId,
      safeAddress,
      fiatCode: currency,
      trusted: false,
    },
    {
      skip: !shouldFetchAllTokens || !isReady,
    },
  )

  return useMemo(() => {
    let hiddenByTokenList = 0
    let hiddenByDustFilter = 0

    const itemsWithoutHidden = currentBalances.items.filter((item) => !hiddenTokens.includes(item.tokenInfo.address))
    const itemsWithoutDust = filterDustTokens(itemsWithoutHidden, hideDust ?? false)

    hiddenByDustFilter = itemsWithoutHidden.length - itemsWithoutDust.length

    if (shouldFetchAllTokens && allTokensBalances && !allTokensLoading) {
      const allTokensWithoutDust = filterDustTokens(allTokensBalances.items, hideDust ?? false)
      const currentTokensWithoutDust = filterDustTokens(currentBalances.items, hideDust ?? false)

      const currentTokensAddresses = new Set(
        currentTokensWithoutDust.map((item) => item.tokenInfo.address.toLowerCase()),
      )

      hiddenByTokenList = allTokensWithoutDust.filter(
        (item) => !currentTokensAddresses.has(item.tokenInfo.address.toLowerCase()),
      ).length
    }

    return {
      hiddenByTokenList,
      hiddenByDustFilter,
    }
  }, [shouldFetchAllTokens, allTokensBalances, allTokensLoading, currentBalances.items, hiddenTokens, hideDust])
}
