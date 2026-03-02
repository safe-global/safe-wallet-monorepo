import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { AppBalance, Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'

export interface PortfolioBalances extends Balances {
  positions?: AppBalance[]
  tokensFiatTotal?: string
  positionsFiatTotal?: string
  isAllTokensMode?: boolean
}

export const initialBalancesState: PortfolioBalances = {
  items: [],
  fiatTotal: '',
}

export const createPortfolioBalances = (balances: Balances): PortfolioBalances => ({
  ...balances,
  tokensFiatTotal: balances.fiatTotal,
  positionsFiatTotal: '0',
  positions: undefined,
})

export const transformPortfolioToBalances = (portfolio?: Portfolio): PortfolioBalances | undefined => {
  if (!portfolio) return undefined

  return {
    items: portfolio.tokenBalances.map((token) => ({
      tokenInfo: {
        ...token.tokenInfo,
        logoUri: token.tokenInfo.logoUri || '',
      },
      balance: token.balance,
      fiatBalance: token.balanceFiat || '0',
      fiatConversion: token.price || '0',
      fiatBalance24hChange: token.priceChangePercentage1d,
    })),
    fiatTotal: portfolio.totalBalanceFiat,
    tokensFiatTotal: portfolio.totalTokenBalanceFiat,
    positionsFiatTotal: portfolio.totalPositionsBalanceFiat,
    positions: portfolio.positionBalances,
  }
}

export const calculateTokensFiatTotal = (items: Balances['items']): string => {
  const total = items.reduce((sum, item) => sum + parseFloat(item.fiatBalance || '0'), 0)
  return total.toString()
}
