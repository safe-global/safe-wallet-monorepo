import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '.'
import { makeLoadableSlice } from './common'

const initialState: Chain[] = []

const { slice, selector } = makeLoadableSlice('chains', initialState)

export const chainsSlice = slice
export const selectChains = selector

export const selectChainById = createSelector(
  [selectChains, (_: RootState, chainId: string) => chainId],
  (chains, chainId) => {
    return chains.data.find((item: Chain) => item.chainId === chainId)
  },
)
