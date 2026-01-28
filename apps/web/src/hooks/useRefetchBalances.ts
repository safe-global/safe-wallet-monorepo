import { useCallback } from 'react'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { usePositionsGetPositionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { usePortfolioGetPortfolioV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useTokenListSetting } from '@/hooks/loadables/useLoadBalances'

/**
 * Shared hook for refetching positions and balances data.
 * Automatically selects the appropriate endpoint (portfolio or positions/balances) based on feature flags.
 *
 * Used by both the portfolio and positions features.
 *
 * @returns Object containing:
 *   - `refetch`: Function to refetch all data (positions + balances)
 *   - `refetchPositions`: Function to refetch positions only
 *   - `shouldUsePortfolioEndpoint`: Boolean indicating if portfolio endpoint is active
 *   - `fulfilledTimeStamp`: Timestamp of the last successful fetch (undefined if no data yet)
 *   - `isFetching`: Boolean indicating if a fetch is currently in progress
 */
export const useRefetchBalances = () => {
  const chainId = useChainId()
  const { safe, safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const isReady = safeAddress && safe.deployed && isTrustedTokenList !== undefined
  const isReadyPortfolio = safeAddress && isTrustedTokenList !== undefined
  const isPositionsEnabled = useHasFeature(FEATURES.POSITIONS) ?? false
  const isPortfolioEndpointEnabled = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false
  const shouldUsePortfolioEndpoint = isPositionsEnabled && isPortfolioEndpointEnabled

  const {
    refetch: portfolioRefetch,
    fulfilledTimeStamp: portfolioFulfilledTimeStamp,
    isFetching: portfolioIsFetching,
  } = usePortfolioGetPortfolioV1Query(
    {
      address: safeAddress,
      chainIds: safe.chainId,
      fiatCode: currency,
      trusted: isTrustedTokenList,
    },
    {
      skip: !shouldUsePortfolioEndpoint || !isReadyPortfolio || !safe.chainId,
    },
  )

  const { refetch: positionsRefetch, isFetching: positionsIsFetching } = usePositionsGetPositionsV1Query(
    { chainId, safeAddress, fiatCode: currency },
    {
      skip: shouldUsePortfolioEndpoint || !safeAddress || !chainId || !currency,
    },
  )

  const { refetch: txServiceBalancesRefetch, isFetching: txServiceBalancesIsFetching } = useBalancesGetBalancesV1Query(
    {
      chainId: safe.chainId,
      safeAddress,
      fiatCode: currency,
      trusted: isTrustedTokenList,
    },
    {
      skip: !isReady || shouldUsePortfolioEndpoint,
    },
  )

  const refetch = useCallback(async () => {
    if (shouldUsePortfolioEndpoint) {
      return portfolioRefetch()
    }
    await Promise.all([positionsRefetch(), txServiceBalancesRefetch()])
  }, [shouldUsePortfolioEndpoint, portfolioRefetch, positionsRefetch, txServiceBalancesRefetch])

  const refetchPositions = useCallback(async () => {
    if (shouldUsePortfolioEndpoint) {
      return portfolioRefetch()
    }
    return positionsRefetch()
  }, [shouldUsePortfolioEndpoint, portfolioRefetch, positionsRefetch])

  const fulfilledTimeStamp = shouldUsePortfolioEndpoint ? portfolioFulfilledTimeStamp : undefined

  const isFetching = shouldUsePortfolioEndpoint
    ? portfolioIsFetching
    : positionsIsFetching || txServiceBalancesIsFetching

  return { refetch, refetchPositions, shouldUsePortfolioEndpoint, fulfilledTimeStamp, isFetching }
}
