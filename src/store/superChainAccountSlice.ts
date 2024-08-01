import { createSelector } from '@reduxjs/toolkit'
import { makeLoadableSlice } from './common'
import type { SuperChainAccount } from '@/types/super-chain'
import { zeroAddress } from 'viem'

export const initialSuperChainAccount: SuperChainAccount = {
  smartAccount: zeroAddress,
  superChainID: '',
  points: BigInt(0),
  level: BigInt(0),
  noun: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
  pointsToNextLevel: null,
  weeklyGasBalance: {
    gasUsedInUSD: BigInt(0),
    maxGasInUSD: BigInt(0),
  },
}

const { slice, selector } = makeLoadableSlice('superChainAccount', initialSuperChainAccount, true)

export const superChainAccountSlice = slice
export const selectSuperChainAccount = selector

export const selectCurrentSuperChainAccount = createSelector(
  selectSuperChainAccount,
  (superChainAccountState): SuperChainAccount => superChainAccountState.data,
)
