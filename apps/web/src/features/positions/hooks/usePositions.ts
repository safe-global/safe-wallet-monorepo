import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { usePositionsGetPositionsV1Query, type Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import type { AppBalance } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import useIsPositionsFeatureEnabled from './useIsPositionsFeatureEnabled'
import { useMemo } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import useBalances from '@/hooks/useBalances'

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
  const isPortfolioEndpointEnabled = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false

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

  const { balances, error: balancesError, loading: balancesLoading } = useBalances()

  return useMemo(
    () => ({
      data: shouldUsePortfolioEndpoint ? transformAppBalancesToProtocols(balances?.positions) : legacyPositionsData,
      error: shouldUsePortfolioEndpoint ? balancesError : legacyPositionsError,
      isLoading: shouldUsePortfolioEndpoint ? balancesLoading : legacyPositionsLoading,
    }),
    [
      shouldUsePortfolioEndpoint,
      balances?.positions,
      legacyPositionsData,
      balancesError,
      legacyPositionsError,
      balancesLoading,
      legacyPositionsLoading,
    ],
  )
}

export default usePositions
