import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'
import { useMemo } from 'react'
import useBalances from './useBalances'
import useHiddenTokens from './useHiddenTokens'
import type { PortfolioBalances } from './loadables/useLoadBalances'

const PRECISION = 18

/**
 * We have to avoid underflows for too high precisions.
 * We only display very few floating points anyway so a precision of 18 should be more than enough.
 */
const truncateNumber = (balance: string): string => {
  const floatingPointPosition = balance.indexOf('.')
  if (floatingPointPosition < 0) {
    return balance
  }

  const currentPrecision = balance.length - floatingPointPosition - 1
  return currentPrecision < PRECISION ? balance : balance.slice(0, floatingPointPosition + PRECISION + 1)
}

const filterHiddenTokens = (items: PortfolioBalances['items'], hiddenAssets: string[]) =>
  items.filter((balanceItem) => !hiddenAssets.includes(balanceItem.tokenInfo.address))

const getVisibleFiatTotal = (balances: PortfolioBalances, hiddenAssets: string[]): string => {
  return safeFormatUnits(
    balances.items
      .reduce(
        (acc, balanceItem) => {
          if (hiddenAssets.includes(balanceItem.tokenInfo.address)) {
            return acc - BigInt(safeParseUnits(truncateNumber(balanceItem.fiatBalance), PRECISION) ?? 0)
          }
          return acc
        },
        BigInt(balances.fiatTotal === '' ? 0 : (safeParseUnits(truncateNumber(balances.fiatTotal), PRECISION) ?? 0)),
      )
      .toString(),
    PRECISION,
  )
}

const getVisibleTokensFiatTotal = (balances: PortfolioBalances, hiddenAssets: string[]): string | undefined => {
  if (!balances.tokensFiatTotal) {
    return undefined
  }
  return safeFormatUnits(
    balances.items
      .reduce(
        (acc, balanceItem) => {
          if (hiddenAssets.includes(balanceItem.tokenInfo.address)) {
            return acc - BigInt(safeParseUnits(truncateNumber(balanceItem.fiatBalance), PRECISION) ?? 0)
          }
          return acc
        },
        BigInt(safeParseUnits(truncateNumber(balances.tokensFiatTotal), PRECISION) ?? 0),
      )
      .toString(),
    PRECISION,
  )
}

export const useVisibleBalances = (): {
  balances: PortfolioBalances
  loaded: boolean
  loading: boolean
  error?: string
} => {
  const data = useBalances()
  const hiddenTokens = useHiddenTokens()

  return useMemo(
    () => ({
      ...data,
      balances: {
        ...data.balances,
        items: filterHiddenTokens(data.balances.items, hiddenTokens),
        fiatTotal: data.balances.fiatTotal ? getVisibleFiatTotal(data.balances, hiddenTokens) : '',
        tokensFiatTotal: data.balances.tokensFiatTotal
          ? getVisibleTokensFiatTotal(data.balances, hiddenTokens)
          : undefined,
        positionsFiatTotal: data.balances.positionsFiatTotal,
      },
    }),
    [data, hiddenTokens],
  )
}
