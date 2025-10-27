import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { PortfolioData } from '../usePortfolio'

/**
 * Constants
 */
export const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'
export const IS_MULTICHAIN_ENABLED = true

/**
 * Creates an empty portfolio data object with default values
 */
export function createEmptyPortfolioData(error?: string, isLoading = false, isFetching = false): PortfolioData {
  return {
    tokenBalances: [],
    positionBalances: [],
    visibleTokenBalances: [],
    totalBalance: '0',
    totalTokenBalance: '0',
    totalPositionsBalance: '0',
    visibleTotalBalance: '0',
    visibleTotalTokenBalance: '0',
    pnl: null,
    error,
    isLoading,
    isLoaded: false,
    isFetching,
  }
}

/**
 * Calculates the total fiat value of a list of tokens
 */
export function calculateTokensTotal(tokens: Balance[]): number {
  return tokens.reduce((sum, token) => sum + parseFloat(token.fiatBalance || '0'), 0)
}

/**
 * Filters out hidden tokens from a list of tokens
 */
export function filterHiddenTokens(tokens: Balance[], hiddenTokens: string[]): Balance[] {
  return tokens.filter((item) => !hiddenTokens.includes(item.tokenInfo.address))
}

/**
 * Calculates the total fiat value of positions (legacy format)
 * Handles the triple-nested structure: protocols -> position groups -> items
 */
export function calculatePositionsTotal(positionsData: any[] | null | undefined): string {
  if (!positionsData) return '0'

  const total = positionsData.reduce((sum, protocol) => {
    const protocolTotal = protocol.items.reduce((protocolSum: number, positionGroup: any) => {
      const groupTotal = positionGroup.items.reduce(
        (itemSum: number, item: any) => itemSum + parseFloat(item.fiatBalance || '0'),
        0,
      )
      return protocolSum + groupTotal
    }, 0)
    return sum + protocolTotal
  }, 0)

  return total.toString()
}
