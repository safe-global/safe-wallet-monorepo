import { useCallback, useMemo } from 'react'
import { usePositionsGetPositionsV1Query, type Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { getPositionsEndpointConfig, transformAppBalancesToProtocols } from '@safe-global/utils/features/positions'
import type { PortfolioBalances } from '@safe-global/utils/hooks/portfolioBalances'
import useTotalBalances from '@safe-global/utils/hooks/useTotalBalances'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { selectUndeployedSafes } from '@/features/counterfactual/public/store/undeployedSafesSlice'
import useChains, { useChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency, selectTokenList, TOKEN_LISTS } from '@/store/settingsSlice'
import { isTrustedTokenList } from '@/utils/tokenList'

export type SafeAssets = {
  balances?: PortfolioBalances
  /** Undefined where the chain has no positions */
  protocols?: Protocol[]
  isDeployed: boolean
  /** The chain is not in the chain configs, so its assets can't be read */
  isUnsupported: boolean
  isLoading: boolean
  isFetching: boolean
  error?: unknown
  /** The positions failed while the tokens loaded */
  positionsError?: unknown
  refetch: () => void
}

/**
 * The tokens and positions of one Safe on one chain, read with the same args as the Safe's own Assets
 * and Positions pages so both share the cache. Not polled: a Space can hold many Safes.
 */
const useSafeAssets = ({ chainId, address, skip = false }: { chainId: string; address: string; skip?: boolean }) => {
  const chain = useChain(chainId)
  const { loading: isLoadingChains } = useChains()
  const isUnsupported = !chain && isLoadingChains === false
  const currency = useAppSelector(selectCurrency)
  const tokenList = useAppSelector(selectTokenList)
  const isDeployed = useAppSelector((state) => !selectUndeployedSafes(state)[chainId]?.[address])

  const hasPortfolioFeature = chain ? hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) : false
  const { shouldUsePortfolioEndpoint, shouldUsePositionsEndpoint } = getPositionsEndpointConfig(
    chain ? hasFeature(chain, FEATURES.POSITIONS) : undefined,
    hasPortfolioFeature,
  )
  const shouldSkip = skip || !isDeployed || isUnsupported

  const totals = useTotalBalances({
    safeAddress: address,
    chainId,
    currency,
    trusted: chain ? isTrustedTokenList(chain, tokenList) : undefined,
    hasPortfolioFeature,
    isAllTokensSelected: tokenList === TOKEN_LISTS.ALL,
    isDeployed,
    skip: shouldSkip,
  })

  const positionsQuery = usePositionsGetPositionsV1Query(
    { chainId, safeAddress: address, fiatCode: currency },
    { skip: shouldSkip || !shouldUsePositionsEndpoint },
  )

  const { refetch: refetchTotals } = totals
  const { refetch: refetchPositions } = positionsQuery
  const refetch = useCallback(() => {
    refetchTotals()
    if (shouldUsePositionsEndpoint) refetchPositions()
  }, [refetchTotals, refetchPositions, shouldUsePositionsEndpoint])

  return useMemo<SafeAssets>(() => {
    const portfolioProtocols = totals.data && (transformAppBalancesToProtocols(totals.data.positions) ?? [])
    const endpointProtocols = shouldUsePositionsEndpoint ? positionsQuery.currentData : undefined

    return {
      balances: totals.data,
      protocols: shouldUsePortfolioEndpoint ? portfolioProtocols : endpointProtocols,
      isDeployed,
      isUnsupported,
      isLoading: !shouldSkip && (totals.loading || (shouldUsePositionsEndpoint && positionsQuery.isLoading)),
      isFetching: totals.isFetching || positionsQuery.isFetching,
      error: totals.error,
      positionsError: shouldUsePositionsEndpoint ? positionsQuery.error : undefined,
      refetch,
    }
  }, [
    totals.data,
    totals.loading,
    totals.error,
    totals.isFetching,
    positionsQuery.isFetching,
    positionsQuery.currentData,
    positionsQuery.isLoading,
    positionsQuery.error,
    shouldUsePortfolioEndpoint,
    shouldUsePositionsEndpoint,
    shouldSkip,
    isDeployed,
    isUnsupported,
    refetch,
  ])
}

export default useSafeAssets
