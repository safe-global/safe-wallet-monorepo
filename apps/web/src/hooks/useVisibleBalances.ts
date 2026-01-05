import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'
import { useMemo } from 'react'
import useBalances from './useBalances'
import useHiddenTokens from './useHiddenTokens'
import type { PortfolioBalances } from './loadables/useLoadBalances'
import { useAppSelector } from '@/store'
import { selectHideDust } from '@/store/settingsSlice'
import { DUST_THRESHOLD } from '@/config/constants'
import useSafeInfo from './useSafeInfo'

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

const filterDustTokens = (items: PortfolioBalances['items'], hideDust: boolean) => {
  if (!hideDust) return items
  return items.filter((balanceItem) => Number(balanceItem.fiatBalance) >= DUST_THRESHOLD)
}

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
  const { safe } = useSafeInfo()
  const data = useBalances()
  const hiddenTokens = useHiddenTokens()
  // Disable dust filtering for counterfactual safes
  const hideDust = useAppSelector(selectHideDust) && safe.deployed

  return useMemo(() => {
    const itemsWithoutHidden = filterHiddenTokens(data.balances.items, hiddenTokens)
    const visibleItems = filterDustTokens(itemsWithoutHidden, hideDust)

    return {
      ...data,
      balances: {
        ...data.balances,
        items: visibleItems,
        fiatTotal: data.balances.fiatTotal ? getVisibleFiatTotal(data.balances, hiddenTokens) : '',
        tokensFiatTotal: data.balances.tokensFiatTotal
          ? getVisibleTokensFiatTotal(data.balances, hiddenTokens)
          : undefined,
        positionsFiatTotal: data.balances.positionsFiatTotal,
      },
    }
  }, [data, hiddenTokens, hideDust])
}
