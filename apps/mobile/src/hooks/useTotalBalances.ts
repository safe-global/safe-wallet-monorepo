import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency, selectTokenList, TOKEN_LISTS } from '@/src/store/settingsSlice'
import { selectActiveChain } from '@/src/store/chains'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { POLLING_INTERVAL } from '@/src/config/constants'
import useTotalBalances, { type TotalBalancesResult } from '@safe-global/utils/hooks/useTotalBalances'

export type { PortfolioBalances } from '@safe-global/utils/hooks/portfolioBalances'

const useTokenListSetting = (): boolean | undefined => {
  const chain = useAppSelector(selectActiveChain)
  const tokenList = useAppSelector(selectTokenList)

  return useMemo(() => {
    if (tokenList === TOKEN_LISTS.ALL) {
      return false
    }
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, tokenList])
}

const useMobileTotalBalances = (): TotalBalancesResult => {
  const activeSafe = useSelector(selectActiveSafe)
  const currency = useAppSelector(selectCurrency)
  const tokenList = useAppSelector(selectTokenList)
  const trusted = useTokenListSetting()
  const hasPortfolioFeature = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false
  const isAllTokensSelected = tokenList === TOKEN_LISTS.ALL

  return useTotalBalances({
    safeAddress: activeSafe?.address ?? '',
    chainId: activeSafe?.chainId ?? '',
    currency,
    trusted,
    hasPortfolioFeature,
    isAllTokensSelected,
    isDeployed: true, // Mobile Safes are always deployed
    portfolioPollingInterval: POLLING_INTERVAL,
    txServicePollingInterval: POLLING_INTERVAL,
    skip: !activeSafe,
  })
}

export default useMobileTotalBalances
