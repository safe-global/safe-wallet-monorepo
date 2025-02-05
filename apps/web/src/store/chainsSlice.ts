import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '.'
import { makeLoadableSlice } from './common'

const initialState: ChainInfo[] = []

const { slice, selector } = makeLoadableSlice('chains', initialState)

export const chainsSlice = slice
export const selectChains = selector

export const selectChainById = createSelector(
  [selectChains, (_: RootState, chainId: string) => chainId],
  (chains, chainId) => {
    return chains.data.find((item: ChainInfo) => item.chainId === chainId)
  },
)
