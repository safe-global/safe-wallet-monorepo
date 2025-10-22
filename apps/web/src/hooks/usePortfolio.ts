import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import {
  selectCurrency,
  selectPortfolioProvider,
  selectUsePortfolioEndpoint,
  PORTFOLIO_PROVIDERS,
} from '@/store/settingsSlice'
import useSafeInfo from './useSafeInfo'
import useHiddenTokens from './useHiddenTokens'
import useLoadBalances, { useTokenListSetting } from './loadables/useLoadBalances'
import useChainId from './useChainId'
import {
  usePortfolioGetPortfolioV1Query,
  type TokenBalance as PortfolioTokenBalance,
  type AppBalance,
} from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import usePositions from '@/features/positions/hooks/usePositions'
import { formatUnits } from 'ethers'

export type PortfolioData = {
  totalBalance: string
  totalTokenBalance: string
  totalPositionsBalance: string
  tokenBalances: Balance[]
  positionBalances: AppBalance[]
  visibleTokenBalances: Balance[]
  visibleTotalTokenBalance: string
  visibleTotalBalance: string
  allChainsTokenBalances?: Balance[]
  allChainsPositionBalances?: AppBalance[]
  allChainsTotalBalance?: string
  allChainsTotalTokenBalance?: string
  allChainsTotalPositionsBalance?: string
  error?: string
  isLoading: boolean
  isLoaded: boolean
  isFetching: boolean
}

const transformTokenBalances = (tokens: PortfolioTokenBalance[]): Balance[] => {
  return tokens.map((token) => ({
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
  const portfolioProvider = useAppSelector(selectPortfolioProvider)
  const isTrustedTokenList = useTokenListSetting()
  const hiddenTokens = useHiddenTokens()

  const isMultichainEnabled = false

  const { currentData, error, isLoading, isFetching } = usePortfolioGetPortfolioV1Query(
    {
      address: safeAddress,
      chainIds: isMultichainEnabled ? undefined : chainId,
      fiatCode: currency,
      trusted: isTrustedTokenList,
      excludeDust: true,
      provider: portfolioProvider === PORTFOLIO_PROVIDERS.AUTO ? undefined : portfolioProvider,
    },
    {
      skip: skip || !safeAddress || !chainId,
      refetchOnFocus: true,
    },
  )

  return useMemo(() => {
    if (!currentData) {
      return {
        tokenBalances: [],
        positionBalances: [],
        visibleTokenBalances: [],
        totalBalance: '0',
        totalTokenBalance: '0',
        totalPositionsBalance: '0',
        visibleTotalBalance: '0',
        visibleTotalTokenBalance: '0',
        error: error?.toString(),
        isLoading,
        isLoaded: false,
        isFetching,
      }
    }

    const allTokens = transformTokenBalances(currentData.tokenBalances ?? [])
    const allPositions = currentData.positionBalances ?? []

    const currentChainTokens = isMultichainEnabled
      ? allTokens.filter((token) => (token.tokenInfo as any).chainId === chainId)
      : allTokens

    const currentChainPositions = isMultichainEnabled
      ? allPositions.filter((app) => app.positions.some((p) => (p.tokenInfo as any).chainId === chainId))
      : allPositions

    const visibleCurrentChainTokens = currentChainTokens.filter(
      (item) => !hiddenTokens.includes(item.tokenInfo.address),
    )

    const totalTokenBalanceFiat = currentData.totalTokenBalanceFiat ?? 0
    const totalPositionsBalanceFiat = currentData.totalPositionsBalanceFiat ?? 0

    const currentChainTokenTotal = currentChainTokens.reduce((sum, t) => sum + parseFloat(t.fiatBalance || '0'), 0)
    const currentChainPositionsTotal = currentChainPositions.reduce((sum, app) => sum + (app.balanceFiat || 0), 0)
    const visibleCurrentChainTokenTotal = visibleCurrentChainTokens.reduce(
      (sum, t) => sum + parseFloat(t.fiatBalance || '0'),
      0,
    )

    return {
      tokenBalances: currentChainTokens,
      positionBalances: currentChainPositions,
      visibleTokenBalances: visibleCurrentChainTokens,
      totalBalance: isMultichainEnabled
        ? (currentChainTokenTotal + currentChainPositionsTotal).toString()
        : (currentData.totalBalanceFiat ?? 0).toString(),
      totalTokenBalance: isMultichainEnabled ? currentChainTokenTotal.toString() : totalTokenBalanceFiat.toString(),
      totalPositionsBalance: isMultichainEnabled
        ? currentChainPositionsTotal.toString()
        : totalPositionsBalanceFiat.toString(),
      visibleTotalBalance: (visibleCurrentChainTokenTotal + currentChainPositionsTotal).toString(),
      visibleTotalTokenBalance: visibleCurrentChainTokenTotal.toString(),
      allChainsTokenBalances: isMultichainEnabled ? allTokens : undefined,
      allChainsPositionBalances: isMultichainEnabled ? allPositions : undefined,
      allChainsTotalBalance: isMultichainEnabled ? (currentData.totalBalanceFiat ?? 0).toString() : undefined,
      allChainsTotalTokenBalance: isMultichainEnabled ? totalTokenBalanceFiat.toString() : undefined,
      allChainsTotalPositionsBalance: isMultichainEnabled ? totalPositionsBalanceFiat.toString() : undefined,
      error: error?.toString(),
      isLoading,
      isLoaded: true,
      isFetching,
    }
  }, [currentData, error, isLoading, isFetching, hiddenTokens, chainId, isMultichainEnabled])
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
        balance: formatUnits(item.balance, item.tokenInfo.decimals),
        balanceFiat: parseFloat(item.fiatBalance),
        priceChangePercentage1d: item.fiatBalance24hChange ? parseFloat(item.fiatBalance24hChange) : null,
      })),
    ),
  }))
}

const usePortfolioLegacy = (skip: boolean = false): PortfolioData => {
  // Load balances from legacy endpoint - this contains all the data fetching logic
  const [balancesData, balancesError, balancesLoading] = useLoadBalances()
  const hiddenTokens = useHiddenTokens()
  const { data: positionsData, isLoading: positionsLoading } = usePositions(skip)

  return useMemo(() => {
    if (!balancesData) {
      return {
        tokenBalances: [],
        positionBalances: [],
        visibleTokenBalances: [],
        totalBalance: '0',
        totalTokenBalance: '0',
        totalPositionsBalance: '0',
        visibleTotalBalance: '0',
        visibleTotalTokenBalance: '0',
        error: balancesError?.message,
        isLoading: balancesLoading,
        isLoaded: false,
        isFetching: balancesLoading || positionsLoading,
      }
    }

    const allTokens = balancesData.items.map((item) => ({
      ...item,
      balance: formatUnits(item.balance, item.tokenInfo.decimals),
    }))

    const visibleTokens = allTokens.filter((item) => !hiddenTokens.includes(item.tokenInfo.address))

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

    // Calculate visible total from visible tokens
    const visibleTokenTotal = visibleTokens.reduce((sum, token) => sum + parseFloat(token.fiatBalance || '0'), 0).toString()
    const allTokenTotal = balancesData.fiatTotal
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
      error: balancesError?.message,
      isLoading: balancesLoading || positionsLoading,
      isLoaded: !balancesLoading && balancesData !== undefined,
      isFetching: balancesLoading || positionsLoading,
    }
  }, [balancesData, balancesError, balancesLoading, hiddenTokens, positionsData, positionsLoading])
}

export const usePortfolio = (): PortfolioData => {
  const usePortfolioEndpoint = useAppSelector(selectUsePortfolioEndpoint)

  const v2Data = usePortfolioV2(!usePortfolioEndpoint)
  const legacyData = usePortfolioLegacy(usePortfolioEndpoint)

  return usePortfolioEndpoint ? v2Data : legacyData
}

export default usePortfolio
