import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { AppBalance } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'

import { createSelector } from '@reduxjs/toolkit'
import { makeLoadableSlice } from './common'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { PortfolioBalances } from '@/hooks/loadables/useLoadBalances'

export const initialBalancesState: Balances = {
  items: [],
  fiatTotal: '',
}

const { slice, selector } = makeLoadableSlice('balances', initialBalancesState)

export const balancesSlice = slice
export const selectBalances = selector

export const selectTokens = createSelector(selectBalances, (balancesState): Balance['tokenInfo'][] =>
  balancesState.data.items.map(({ tokenInfo }) => tokenInfo),
)

export const selectPositions = createSelector(selectBalances, (balancesState): AppBalance[] | undefined => {
  return (balancesState.data as PortfolioBalances)?.positions
})
