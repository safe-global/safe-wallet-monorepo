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

/**
 * Removes the given token addresses from a balances object, adjusting the fiat totals accordingly.
 * Matching is case-insensitive. Returns the original object untouched when nothing matches so
 * downstream memoization stays referentially stable.
 */
export const excludeTokensFromBalances = (
  balances: PortfolioBalances,
  excludedAddresses: string[],
): PortfolioBalances => {
  const excluded = new Set(excludedAddresses.map((address) => address.toLowerCase()))
  const removed = balances.items.filter((item) => excluded.has(item.tokenInfo.address.toLowerCase()))

  if (removed.length === 0) {
    return balances
  }

  const items = balances.items.filter((item) => !excluded.has(item.tokenInfo.address.toLowerCase()))
  const removedFiat = removed.reduce((sum, item) => sum + parseFloat(item.fiatBalance || '0'), 0)
  const subtract = (total: string): string => (parseFloat(total) - removedFiat).toString()

  return {
    ...balances,
    items,
    fiatTotal: balances.fiatTotal ? subtract(balances.fiatTotal) : balances.fiatTotal,
    tokensFiatTotal: balances.tokensFiatTotal != null ? subtract(balances.tokensFiatTotal) : balances.tokensFiatTotal,
  }
}
