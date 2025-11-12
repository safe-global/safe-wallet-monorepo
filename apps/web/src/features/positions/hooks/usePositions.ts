import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { usePositionsGetPositionsV1Query, type Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { selectPositions, selectBalances } from '@/store/balancesSlice'
import type { AppBalance } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import useIsPositionsFeatureEnabled from './useIsPositionsFeatureEnabled'
import { useMemo } from 'react'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'

const POLLING_INTERVAL = 300_000 // 5 minutes

const transformAppBalancesToProtocols = (appBalances?: AppBalance[]): Protocol[] | undefined => {
  if (!appBalances) return undefined

  return appBalances.map((appBalance) => ({
    protocol: appBalance.appInfo.name,
    protocol_metadata: {
      name: appBalance.appInfo.name,
      icon: {
        url: appBalance.appInfo.logoUrl ?? null,
      },
    },
    fiatTotal: appBalance.balanceFiat,
    items: appBalance.groups.map((group) => ({
      name: group.name,
      items: group.items.map((position) => ({
        balance: position.balance,
        fiatBalance: position.balanceFiat || '0',
        fiatConversion: '0',
        tokenInfo: {
          ...position.tokenInfo,
          logoUri: position.tokenInfo.logoUri || '',
        },
        fiatBalance24hChange: position.priceChangePercentage1d ?? null,
        position_type: (position.type as Protocol['items'][0]['items'][0]['position_type']) || null,
      })),
    })),
  }))
}

const usePositions = () => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)
  const isPositionsEnabled = useIsPositionsFeatureEnabled()
  const chain = useCurrentChain()

  const isPortfolioEndpointEnabled = useMemo(
    () => (chain ? hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) : false),
    [chain],
  )

  const shouldUsePortfolioEndpoint = isPositionsEnabled && isPortfolioEndpointEnabled
  const shouldUsePositionEndpoint = isPositionsEnabled && !isPortfolioEndpointEnabled

  const {
    currentData: legacyPositionsData,
    error: legacyPositionsError,
    isLoading: legacyPositionsLoading,
  } = usePositionsGetPositionsV1Query(
    { chainId, safeAddress, fiatCode: currency },
    {
      skip: !shouldUsePositionEndpoint || !safeAddress || !chainId || !currency,
      pollingInterval: POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  const portfolioPositions = useAppSelector(selectPositions)
  const balancesState = useAppSelector(selectBalances)

  return useMemo(
    () => ({
      data: shouldUsePortfolioEndpoint ? transformAppBalancesToProtocols(portfolioPositions) : legacyPositionsData,
      error: shouldUsePortfolioEndpoint ? balancesState.error : legacyPositionsError,
      isLoading: shouldUsePortfolioEndpoint ? balancesState.loading : legacyPositionsLoading,
    }),
    [
      shouldUsePortfolioEndpoint,
      portfolioPositions,
      legacyPositionsData,
      balancesState.error,
      legacyPositionsError,
      balancesState.loading,
      legacyPositionsLoading,
    ],
  )
}

export default usePositions
