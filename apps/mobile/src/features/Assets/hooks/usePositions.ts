import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { skipToken } from '@reduxjs/toolkit/query'

import { POSITIONS_POLLING_INTERVAL } from '@/src/config/constants'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { usePositionsGetPositionsV1Query, type Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { usePortfolioGetPortfolioV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { transformAppBalancesToProtocols, getPositionsEndpointConfig } from '@safe-global/utils/features/positions'

interface UsePositionsResult {
  data: Protocol[] | undefined
  error: unknown
  isLoading: boolean
  isFetching: boolean
  refetch: () => void
}

export const usePositions = (): UsePositionsResult => {
  const activeSafe = useSelector(selectActiveSafe)
  const currency = useAppSelector(selectCurrency)

  const isPositionsEnabled = useHasFeature(FEATURES.POSITIONS)
  const isPortfolioEndpointEnabled = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT)

  const { shouldUsePortfolioEndpoint, shouldUsePositionsEndpoint } = getPositionsEndpointConfig(
    isPositionsEnabled,
    isPortfolioEndpointEnabled,
  )

  const {
    data: positionsData,
    error: positionsError,
    isLoading: positionsLoading,
    isFetching: positionsFetching,
    refetch: positionsRefetch,
  } = usePositionsGetPositionsV1Query(
    !activeSafe || !shouldUsePositionsEndpoint
      ? skipToken
      : {
          chainId: activeSafe.chainId,
          safeAddress: activeSafe.address,
          fiatCode: currency,
        },
    {
      pollingInterval: POSITIONS_POLLING_INTERVAL,
    },
  )

  const {
    data: portfolioData,
    error: portfolioError,
    isLoading: portfolioLoading,
    isFetching: portfolioFetching,
    refetch: portfolioRefetch,
  } = usePortfolioGetPortfolioV1Query(
    !activeSafe || !shouldUsePortfolioEndpoint
      ? skipToken
      : {
          address: activeSafe.address,
          chainIds: activeSafe.chainId,
          fiatCode: currency,
        },
    {
      pollingInterval: POSITIONS_POLLING_INTERVAL,
    },
  )

  return useMemo(
    () => ({
      data: shouldUsePortfolioEndpoint
        ? transformAppBalancesToProtocols(portfolioData?.positionBalances)
        : positionsData,
      error: shouldUsePortfolioEndpoint ? portfolioError : positionsError,
      isLoading: shouldUsePortfolioEndpoint ? portfolioLoading : positionsLoading,
      isFetching: shouldUsePortfolioEndpoint ? portfolioFetching : positionsFetching,
      refetch: shouldUsePortfolioEndpoint ? portfolioRefetch : positionsRefetch,
    }),
    [
      shouldUsePortfolioEndpoint,
      portfolioData?.positionBalances,
      positionsData,
      portfolioError,
      positionsError,
      portfolioLoading,
      positionsLoading,
      portfolioFetching,
      positionsFetching,
      portfolioRefetch,
      positionsRefetch,
    ],
  )
}
