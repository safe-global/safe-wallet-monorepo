import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useSafeInfo from './useSafeInfo'
import useHiddenTokens from './useHiddenTokens'
import { useTokenListSetting } from './loadables/useLoadBalances'
import useChainId from './useChainId'
import { useHasFeature } from './useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  usePortfolioGetPortfolioV1Query,
  type TokenBalance as PortfolioTokenBalance,
} from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { useVisibleBalances } from './useVisibleBalances'
import useBalances from './useBalances'
import usePositions from '@/features/positions/hooks/usePositions'
import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'

const PRECISION = 18

/**
 * Truncates a number string to avoid underflows with high precision
 */
const truncateNumber = (balance: string): string => {
  const floatingPointPosition = balance.indexOf('.')
  if (floatingPointPosition < 0) {
    return balance
  }

  const currentPrecision = balance.length - floatingPointPosition - 1
  return currentPrecision < PRECISION ? balance : balance.slice(0, floatingPointPosition + PRECISION + 1)
}

const transformTokenBalances = (tokens: PortfolioTokenBalance[], currentChainId: string): Balance[] => {
  // Filter tokens to only include those from the current chain
  return tokens
    .filter((token) => token.tokenInfo.chainId === currentChainId)
    .map((token) => ({
      balance: token.balance,
      fiatBalance: token.balanceFiat ?? '0',
      fiatConversion: token.price ?? '0',
      fiatBalance24hChange: token.priceChangePercentage1d,
      tokenInfo: {
        address: token.tokenInfo.address,
        decimals: token.tokenInfo.decimals,
        symbol: token.tokenInfo.symbol,
        name: token.tokenInfo.name,
        chainId: token.tokenInfo.chainId,
        logoUri: token.tokenInfo.logoUrl ?? '',
        type:
          token.tokenInfo.address === '0x0000000000000000000000000000000000000000'
            ? TokenType.NATIVE_TOKEN
            : TokenType.ERC20,
      },
    }))
}

/**
 * usePortfolioV2 - Uses the new unified portfolio endpoint (v1/portfolios)
 * This hook fetches token balances and positions in a single API call
 */
const usePortfolioV2 = (skip: boolean = false) => {
  const { safeAddress } = useSafeInfo()
  const chainId = useChainId()
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const hiddenTokens = useHiddenTokens()

  const { currentData, error, isLoading, isFetching } = usePortfolioGetPortfolioV1Query(
    {
      address: safeAddress,
      chainIds: chainId,
      fiatCode: currency,
      trusted: isTrustedTokenList,
      excludeDust: true,
    },
    {
      skip: skip || !safeAddress || !chainId,
      refetchOnFocus: true,
    },
  )

  return useMemo(() => {
    // Since we're passing chainIds to the API, tokens should already be filtered by chain
    const allTokens = transformTokenBalances(currentData?.tokenBalances ?? [], chainId)

    // Position balances are also already filtered by chain from the API
    const positionBalances = currentData?.positionBalances ?? []

    // Filter hidden tokens
    const visibleTokens = allTokens.filter((item) => !hiddenTokens.includes(item.tokenInfo.address))

    // Recalculate token total for visible tokens only using BigInt for precision
    // This matches the legacy calculation logic to avoid discrepancies
    const totalTokenBalanceFiat = currentData?.totalTokenBalanceFiat ?? '0'
    const totalTokenBalanceBigInt = BigInt(safeParseUnits(truncateNumber(totalTokenBalanceFiat), PRECISION) ?? 0)

    // Subtract hidden token balances from total
    const visibleTokenTotalBigInt = allTokens.reduce((acc, item) => {
      if (hiddenTokens.includes(item.tokenInfo.address)) {
        return acc - BigInt(safeParseUnits(truncateNumber(item.fiatBalance), PRECISION) ?? 0)
      }
      return acc
    }, totalTokenBalanceBigInt)

    const visibleTokenTotal = safeFormatUnits(visibleTokenTotalBigInt.toString(), PRECISION)

    // Get positions total from API (already filtered by chain)
    const positionsTotal = currentData?.totalPositionsBalanceFiat ?? '0'

    // Recalculate combined total (visible tokens + positions) using BigInt
    const positionsTotalBigInt = BigInt(safeParseUnits(truncateNumber(positionsTotal), PRECISION) ?? 0)
    const visibleCombinedTotalBigInt = visibleTokenTotalBigInt + positionsTotalBigInt
    const visibleCombinedTotal = safeFormatUnits(visibleCombinedTotalBigInt.toString(), PRECISION)

    return {
      // All data from API (already filtered by current chain via chainIds parameter)
      totalBalance: currentData?.totalBalanceFiat ?? '0',
      totalTokenBalance: totalTokenBalanceFiat,
      totalPositionsBalance: positionsTotal,
      tokenBalances: allTokens,
      positionBalances,

      // Visible tokens (filtered) - RECALCULATED with BigInt precision
      visibleTokenBalances: visibleTokens,
      visibleTotalTokenBalance: visibleTokenTotal,
      visibleTotalBalance: visibleCombinedTotal,

      error: error?.toString(),
      isLoading,
      isLoaded: !!currentData,
      isFetching,
    }
  }, [currentData, error, isLoading, isFetching, hiddenTokens, chainId])
}

/**
 * usePortfolioLegacy - Fallback using old balance and position hooks
 * This hook combines data from the legacy useBalances and usePositions hooks
 * to provide the same interface as usePortfolioV2
 */
const usePortfolioLegacy = (skip: boolean = false) => {
  const { balances, loaded, loading, error } = useVisibleBalances()
  const allBalancesData = useBalances()
  const { data: positionsData, isLoading: positionsLoading } = usePositions(skip)

  return useMemo(() => {
    // All tokens from balances (unfiltered)
    const allTokens = allBalancesData.balances.items

    // Visible tokens (already filtered by useVisibleBalances)
    const visibleTokens = balances.items

    // Calculate positions total
    const positionsTotal = positionsData
      ? positionsData
          .reduce((sum, protocol) => {
            const protocolTotal = protocol.items.reduce((protocolSum, positionGroup) => {
              const groupTotal = positionGroup.items.reduce(
                (itemSum, item) => itemSum + parseFloat(item.fiatBalance || '0'),
                0,
              )
              return protocolSum + groupTotal
            }, 0)
            return sum + protocolTotal
          }, 0)
          .toString()
      : '0'

    // Get visible token total (already calculated by useVisibleBalances)
    const visibleTokenTotal = balances.fiatTotal

    // Calculate combined total
    const visibleCombinedTotal = (parseFloat(visibleTokenTotal) + parseFloat(positionsTotal)).toString()

    // Calculate all token total
    const allTokenTotal = allBalancesData.balances.fiatTotal

    // Calculate combined total for all tokens
    const allCombinedTotal = (parseFloat(allTokenTotal) + parseFloat(positionsTotal)).toString()

    return {
      // All data
      totalBalance: allCombinedTotal,
      totalTokenBalance: allTokenTotal,
      totalPositionsBalance: positionsTotal,
      tokenBalances: allTokens,
      positionBalances: positionsData ?? [],

      // Visible tokens (filtered)
      visibleTokenBalances: visibleTokens,
      visibleTotalTokenBalance: visibleTokenTotal,
      visibleTotalBalance: visibleCombinedTotal,

      error,
      isLoading: loading || positionsLoading,
      isLoaded: loaded,
      isFetching: loading || positionsLoading,
    }
  }, [balances, allBalancesData, positionsData, loaded, loading, error, positionsLoading])
}

/**
 * usePortfolio - Main portfolio hook with feature flag support
 *
 * This hook checks if the PORTFOLIO_ENDPOINT feature is enabled for the current chain.
 * If enabled, it uses the new unified portfolio endpoint (usePortfolioV2).
 * If not enabled, it falls back to the legacy hooks (useVisibleBalances + usePositions).
 *
 * This allows for gradual rollout of the new portfolio endpoint per chain.
 *
 * Note: Both hooks are always called to comply with React rules of hooks,
 * but skip parameters prevent unnecessary API calls.
 */
export const usePortfolio = () => {
  const hasPortfolioEndpoint = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT)

  // Both hooks must be called unconditionally (React rules of hooks)
  // Skip parameters prevent unnecessary API calls based on feature flag
  const v2Data = usePortfolioV2(!hasPortfolioEndpoint)
  const legacyData = usePortfolioLegacy(hasPortfolioEndpoint)

  return hasPortfolioEndpoint ? v2Data : legacyData
}

export default usePortfolio
