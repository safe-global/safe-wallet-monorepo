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
  type AppBalance,
} from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { useVisibleBalances } from './useVisibleBalances'
import useBalances from './useBalances'
import usePositions from '@/features/positions/hooks/usePositions'
import { IS_DEV } from '@/config/constants'

export type PortfolioData = {
  totalBalance: string
  totalTokenBalance: string
  totalPositionsBalance: string
  tokenBalances: Balance[]
  positionBalances: AppBalance[]
  visibleTokenBalances: Balance[]
  visibleTotalTokenBalance: string
  visibleTotalBalance: string
  error?: string
  isLoading: boolean
  isLoaded: boolean
  isFetching: boolean
}

const transformTokenBalances = (tokens: PortfolioTokenBalance[], currentChainId: string): Balance[] => {
  return tokens
    .filter((token) => token.tokenInfo.chainId === currentChainId)
    .map((token) => ({
      balance: token.balance,
      fiatBalance: (token.balanceFiat ?? 0).toString(),
      fiatConversion: (token.price ?? 0).toString(),
      fiatBalance24hChange: token.priceChangePercentage1d != null ? token.priceChangePercentage1d.toString() : null,
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

const usePortfolioV2 = (skip: boolean = false): PortfolioData => {
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
    const allTokens = transformTokenBalances(currentData?.tokenBalances ?? [], chainId)
    const positionBalances = currentData?.positionBalances ?? []
    const visibleTokens = allTokens.filter((item) => !hiddenTokens.includes(item.tokenInfo.address))

    const totalTokenBalanceFiat = currentData?.totalTokenBalanceFiat ?? 0
    const positionsTotal = currentData?.totalPositionsBalanceFiat ?? 0

    const visibleTokenTotalNumber = allTokens.reduce((acc, item) => {
      if (hiddenTokens.includes(item.tokenInfo.address)) {
        return acc - parseFloat(item.fiatBalance)
      }
      return acc
    }, totalTokenBalanceFiat)

    return {
      totalBalance: (currentData?.totalBalanceFiat ?? 0).toString(),
      totalTokenBalance: totalTokenBalanceFiat.toString(),
      totalPositionsBalance: positionsTotal.toString(),
      tokenBalances: allTokens,
      positionBalances,
      visibleTokenBalances: visibleTokens,
      visibleTotalTokenBalance: visibleTokenTotalNumber.toString(),
      visibleTotalBalance: (visibleTokenTotalNumber + positionsTotal).toString(),
      error: error?.toString(),
      isLoading,
      isLoaded: !!currentData,
      isFetching,
    }
  }, [currentData, error, isLoading, isFetching, hiddenTokens, chainId])
}

const transformProtocolsToAppBalances = (protocols: any[]): AppBalance[] => {
  return protocols.map((protocol) => ({
    appInfo: {
      name: protocol.protocol_metadata.name,
      logoUrl: protocol.protocol_metadata.icon.url,
      url: null,
    },
    balanceFiat: parseFloat(protocol.fiatTotal),
    positions: protocol.items.flatMap((positionGroup: any) =>
      positionGroup.items.map((item: any) => ({
        key: `${item.tokenInfo.address}-${item.position_type}`,
        type: item.position_type || 'unknown',
        name: item.tokenInfo.name,
        tokenInfo: {
          address: item.tokenInfo.address,
          decimals: item.tokenInfo.decimals,
          symbol: item.tokenInfo.symbol,
          name: item.tokenInfo.name,
          logoUrl: item.tokenInfo.logoUri,
          chainId: '', // Not available in old structure
        },
        balance: item.balance,
        balanceFiat: parseFloat(item.fiatBalance),
        priceChangePercentage1d: item.fiatBalance24hChange ? parseFloat(item.fiatBalance24hChange) : null,
      })),
    ),
  }))
}

const usePortfolioLegacy = (skip: boolean = false): PortfolioData => {
  const { balances, loaded, loading, error } = useVisibleBalances()
  const allBalancesData = useBalances()
  const { data: positionsData, isLoading: positionsLoading } = usePositions(skip)

  return useMemo(() => {
    const allTokens = allBalancesData.balances.items
    const visibleTokens = balances.items

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

    const visibleTokenTotal = balances.fiatTotal
    const allTokenTotal = allBalancesData.balances.fiatTotal

    // Transform legacy Protocol[] to AppBalance[]
    const transformedPositions = positionsData ? transformProtocolsToAppBalances(positionsData) : []

    return {
      totalBalance: (parseFloat(allTokenTotal) + parseFloat(positionsTotal)).toString(),
      totalTokenBalance: allTokenTotal,
      totalPositionsBalance: positionsTotal,
      tokenBalances: allTokens,
      positionBalances: transformedPositions,
      visibleTokenBalances: visibleTokens,
      visibleTotalTokenBalance: visibleTokenTotal,
      visibleTotalBalance: (parseFloat(visibleTokenTotal) + parseFloat(positionsTotal)).toString(),
      error,
      isLoading: loading || positionsLoading,
      isLoaded: loaded,
      isFetching: loading || positionsLoading,
    }
  }, [balances, allBalancesData, positionsData, loaded, loading, error, positionsLoading])
}

export const usePortfolio = (): PortfolioData => {
  const chainId = useChainId()
  let hasPortfolioEndpoint = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT)

  if (IS_DEV && chainId === '1') {
    hasPortfolioEndpoint = true
    console.log('[Dev Override] Portfolio endpoint enabled for Ethereum mainnet (chain 1)')
  }

  const v2Data = usePortfolioV2(!hasPortfolioEndpoint)
  const legacyData = usePortfolioLegacy(hasPortfolioEndpoint)

  return hasPortfolioEndpoint ? v2Data : legacyData
}

export default usePortfolio
