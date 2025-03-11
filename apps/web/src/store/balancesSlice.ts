import { type TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { createSelector } from '@reduxjs/toolkit'
import { makeLoadableSlice } from './common'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

export const initialBalancesState: Balances = {
  items: [],
  fiatTotal: '',
}

const { slice, selector } = makeLoadableSlice('balances', initialBalancesState)

export const balancesSlice = slice
export const selectBalances = selector

export const selectTokens = createSelector(selectBalances, (balancesState): TokenInfo[] =>
  balancesState.data.items.map(({ tokenInfo }) => tokenInfo),
)
