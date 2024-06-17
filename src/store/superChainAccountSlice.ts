import { createSelector } from '@reduxjs/toolkit'
import { makeLoadableSlice } from './common'
import type { SuperChainAccount } from '@/types/super-chain'
import { zeroAddress } from 'viem'

export const initialSuperChainAccount = {
  smartAccount: zeroAddress,
  superChainID: '',
  points: BigInt(0),
  level: BigInt(0),
  eoas: [zeroAddress],
  noun: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
  pointsToNextLevel: null,
}

const { slice, selector } = makeLoadableSlice('superChainAccount', initialSuperChainAccount, true)

export const superChainAccountSlice = slice
export const selectSuperChainAccount = selector

export const selectCurrentSuperChainAccount = createSelector(
  selectSuperChainAccount,
  (superChainAccountState): SuperChainAccount => superChainAccountState.data,
)
