import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import {
  selectCurrency,
  selectPortfolioProvider,
  selectUsePortfolioEndpoint,
  selectExcludeDustTokens,
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
import usePositions from '@/features/positions/hooks/usePositions'
import { formatUnits } from 'ethers'
import {
  IS_MULTICHAIN_ENABLED,
  createEmptyPortfolioData,
  calculateTokensTotal,
  filterHiddenTokens,
  calculatePositionsTotal,
} from './utils/portfolioCalculations'
import type { LegacyProtocol, LegacyPositionGroup, LegacyPositionItem } from '@/types/legacyPortfolio'

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
      logoUri: token.tokenInfo.logoUri ?? '',
      type: token.tokenInfo.type,
    },
  }))
}

const transformAppBalances = (appBalances: AppBalance[]): AppBalance[] => {
  return appBalances.map((appBalance) => ({
    ...appBalance,
    positions: appBalance.positions.map((position) => ({
      ...position,
      tokenInfo: {
        ...position.tokenInfo,
        logoUri: position.tokenInfo.logoUri ?? '',
        type: position.tokenInfo.type,
      },
    })),
  }))
}

const usePortfolioV2 = (skip: boolean = false): PortfolioData => {
  const { safeAddress } = useSafeInfo()
  const chainId = useChainId()
  const currency = useAppSelector(selectCurrency)
  const portfolioProvider = useAppSelector(selectPortfolioProvider)
  const isTrustedTokenList = useTokenListSetting()
  const hiddenTokens = useHiddenTokens()
  const excludeDust = useAppSelector(selectExcludeDustTokens)

  const { currentData, error, isLoading, isFetching } = usePortfolioGetPortfolioV1Query(
    {
      address: safeAddress,
      chainIds: IS_MULTICHAIN_ENABLED ? undefined : chainId,
      fiatCode: currency,
      trusted: isTrustedTokenList,
      excludeDust,
      provider: portfolioProvider === PORTFOLIO_PROVIDERS.AUTO ? undefined : portfolioProvider,
    },
    {
      skip: skip || !safeAddress || !chainId,
      refetchOnFocus: true,
    },
  )

  return useMemo(() => {
    if (!currentData) {
      return createEmptyPortfolioData(error?.toString(), isLoading, isFetching)
    }

    const allTokens = transformTokenBalances(currentData.tokenBalances ?? [])
    const allPositions = transformAppBalances(currentData.positionBalances ?? [])

    const currentChainTokens = IS_MULTICHAIN_ENABLED
      ? allTokens.filter((token) => (token.tokenInfo as any).chainId === chainId)
      : allTokens

    const currentChainPositions = IS_MULTICHAIN_ENABLED
      ? allPositions.filter((app) => app.positions.some((p) => (p.tokenInfo as any).chainId === chainId))
      : allPositions

    const visibleCurrentChainTokens = filterHiddenTokens(currentChainTokens, hiddenTokens)

    const totalTokenBalanceFiat = currentData.totalTokenBalanceFiat ?? 0
    const totalPositionsBalanceFiat = currentData.totalPositionsBalanceFiat ?? 0

    const currentChainTokenTotal = calculateTokensTotal(currentChainTokens)
    const currentChainPositionsTotal = currentChainPositions.reduce((sum, app) => sum + (app.balanceFiat || 0), 0)
    const visibleCurrentChainTokenTotal = calculateTokensTotal(visibleCurrentChainTokens)

    return {
      tokenBalances: currentChainTokens,
      positionBalances: currentChainPositions,
      visibleTokenBalances: visibleCurrentChainTokens,
      totalBalance: IS_MULTICHAIN_ENABLED
        ? (currentChainTokenTotal + currentChainPositionsTotal).toString()
        : (currentData.totalBalanceFiat ?? 0).toString(),
      totalTokenBalance: IS_MULTICHAIN_ENABLED ? currentChainTokenTotal.toString() : totalTokenBalanceFiat.toString(),
      totalPositionsBalance: IS_MULTICHAIN_ENABLED
        ? currentChainPositionsTotal.toString()
        : totalPositionsBalanceFiat.toString(),
      visibleTotalBalance: (visibleCurrentChainTokenTotal + currentChainPositionsTotal).toString(),
      visibleTotalTokenBalance: visibleCurrentChainTokenTotal.toString(),
      allChainsTokenBalances: IS_MULTICHAIN_ENABLED ? allTokens : undefined,
      allChainsPositionBalances: IS_MULTICHAIN_ENABLED ? allPositions : undefined,
      allChainsTotalBalance: IS_MULTICHAIN_ENABLED ? (currentData.totalBalanceFiat ?? 0).toString() : undefined,
      allChainsTotalTokenBalance: IS_MULTICHAIN_ENABLED ? totalTokenBalanceFiat.toString() : undefined,
      allChainsTotalPositionsBalance: IS_MULTICHAIN_ENABLED ? totalPositionsBalanceFiat.toString() : undefined,
      error: error?.toString(),
      isLoading,
      isLoaded: true,
      isFetching,
    }
  }, [currentData, error, isLoading, isFetching, hiddenTokens, chainId])
}

const transformProtocolsToAppBalances = (protocols: LegacyProtocol[]): AppBalance[] => {
  return protocols.map((protocol) => ({
    appInfo: {
      name: protocol.protocol_metadata.name,
      logoUrl: protocol.protocol_metadata.icon.url ?? '',
      url: null,
    },
    balanceFiat: parseFloat(protocol.fiatTotal),
    positions: protocol.items.flatMap((positionGroup: LegacyPositionGroup) =>
      positionGroup.items.map((item: LegacyPositionItem) => ({
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
      return createEmptyPortfolioData(balancesError?.message, balancesLoading, balancesLoading || positionsLoading)
    }

    const allTokens = balancesData.items.map((item) => ({
      ...item,
      balance: formatUnits(item.balance, item.tokenInfo.decimals),
    }))

    const visibleTokens = filterHiddenTokens(allTokens, hiddenTokens)
    const positionsTotal = calculatePositionsTotal(positionsData)
    const visibleTokenTotal = calculateTokensTotal(visibleTokens).toString()
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
