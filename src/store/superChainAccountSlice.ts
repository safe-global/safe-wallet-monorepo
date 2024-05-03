import { createSelector } from '@reduxjs/toolkit'
import { makeLoadableSlice } from './common'
import type { SuperChainAccount } from '@/types/super-chain'

export const initialSuperChainAccount = null

const { slice, selector } = makeLoadableSlice('superChainAccount', initialSuperChainAccount)

export const superChainAccountSlice = slice
export const selectSuperChainAccount = selector

export const selectCurrentSuperChainAccount = createSelector(
  selectSuperChainAccount,
  (superChainAccountState): SuperChainAccount | null => superChainAccountState.data,
)
