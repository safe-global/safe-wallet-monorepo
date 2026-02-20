import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { usePositionsGetPositionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import useIsPositionsFeatureEnabled from './useIsPositionsFeatureEnabled'
import { useMemo } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import useBalances from '@/hooks/useBalances'
import { transformAppBalancesToProtocols, getPositionsEndpointConfig } from '@safe-global/utils/features/positions'

const POLLING_INTERVAL = 300_000 // 5 minutes

/**
 * Hook to load positions data.
 * Uses portfolio endpoint when enabled, otherwise falls back to positions endpoint.
 */
const usePositions = () => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)
  const isPositionsEnabled = useIsPositionsFeatureEnabled()
  const isPortfolioEndpointEnabled = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT)

  const { shouldUsePortfolioEndpoint, shouldUsePositionsEndpoint: shouldUsePositionEndpoint } =
    getPositionsEndpointConfig(isPositionsEnabled, isPortfolioEndpointEnabled)

  const {
    currentData: positionsData,
    error: positionsError,
    isLoading: positionsLoading,
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
      data: shouldUsePortfolioEndpoint ? transformAppBalancesToProtocols(balances?.positions) : positionsData,
      error: shouldUsePortfolioEndpoint ? balancesError : positionsError,
      isLoading: shouldUsePortfolioEndpoint ? balancesLoading : positionsLoading,
    }),
    [
      shouldUsePortfolioEndpoint,
      balances?.positions,
      positionsData,
      balancesError,
      positionsError,
      balancesLoading,
      positionsLoading,
    ],
  )
}

export default usePositions
