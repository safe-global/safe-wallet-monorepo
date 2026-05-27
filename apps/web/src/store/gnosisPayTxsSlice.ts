import { type PayloadAction, createSlice, createSelector } from '@reduxjs/toolkit'
import { type SafeTransactionData } from '@safe-global/types-kit'
import { type RootState } from '.'

export type GnosisPayTxItem = {
  /** The original SafeTransactionData that got submitted to the DelayModifier */
  safeTxData: SafeTransactionData

  /** Nonce within the delay modifier */
  queueNonce: number

  /** Time in millis when the tx becomes executable */
  executableAt: number

  /**  Time in millis when the tx expires */
  expiresAt: number

  /** Safe for which the tx is queued */
  safeAddress: string
}

export type GnosisPayTxsState = {
  [safeAddress: string]: GnosisPayTxItem[]
}

const initialState: GnosisPayTxsState = {}

export const gnosisPayTxsSlice = createSlice({
  name: 'gnosisPayTxs',
  initialState,
  reducers: {
    enqueueTransaction: (state, { payload }: PayloadAction<GnosisPayTxItem>) => {
      state[payload.safeAddress] ??= []
      state[payload.safeAddress].push(payload)
      // Always sort by queueNonce
      state[payload.safeAddress].sort((a, b) => a.queueNonce - b.queueNonce)
    },

    skipExpired: (state, { payload }: PayloadAction<{ safeAddress: string }>) => {
      state[payload.safeAddress] = state[payload.safeAddress]?.filter((value) => Date.now() < value.expiresAt)
      if (Object.values(state[payload.safeAddress] ?? {}).length === 0) {
        delete state[payload.safeAddress]
      }
    },

    removeFirst: (state, { payload }: PayloadAction<{ safeAddress: string }>) => {
      state[payload.safeAddress] = state[payload.safeAddress]?.slice(1)
      if (Object.values(state[payload.safeAddress] ?? {}).length === 0) {
        delete state[payload.safeAddress]
      }
    },
  },
})

export const { enqueueTransaction, skipExpired, removeFirst } = gnosisPayTxsSlice.actions

export const selectAllGnosisPayTransactions = (state: RootState) => state.gnosisPayTxs

export const selectQueuedGnosisPayTransactions = (safeAddress: string) =>
  createSelector([selectAllGnosisPayTransactions], (allQueues): GnosisPayTxItem[] => {
    return allQueues[safeAddress] ?? []
  })
