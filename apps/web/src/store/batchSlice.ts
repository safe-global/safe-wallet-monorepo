import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.'
import { selectChainIdAndSafeAddress } from '@/store/common'
import type { MetaTransactionData, OperationType } from '@safe-global/types-kit'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

export type CallOnlyTxData = MetaTransactionData & { operation: OperationType.Call }

export type DraftBatchItem = {
  id: string
  timestamp: number
  // For Backwards compatibility we handle txDetails as well
  txDetails?: TransactionDetails
  txData: CallOnlyTxData
}

export type BatchTxsState = {
  [chainId: string]: {
    [safeAddress: string]: DraftBatchItem[]
  }
}

const initialState: BatchTxsState = {}

export const batchSlice = createSlice({
  name: 'batch',
  initialState,
  reducers: {
    // Add a tx to the batch
    addTx: (
      state,
      action: PayloadAction<{
        chainId: string
        safeAddress: string
        txData: CallOnlyTxData
      }>,
    ) => {
      const { chainId, safeAddress, txData } = action.payload
      state[chainId] = state[chainId] || {}
      state[chainId][safeAddress] = state[chainId][safeAddress] || []
      state[chainId][safeAddress].push({
        id: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
        txData,
      })
    },

    // Remove a tx to the batch by txId
    removeTx: (
      state,
      action: PayloadAction<{
        chainId: string
        safeAddress: string
        id: string
      }>,
    ) => {
      const { chainId, safeAddress, id } = action.payload
      state[chainId] = state[chainId] || {}
      state[chainId][safeAddress] = state[chainId][safeAddress] || []
      state[chainId][safeAddress] = state[chainId][safeAddress].filter((item) => item.id !== id)
    },
  },
})

export const { addTx, removeTx } = batchSlice.actions

const selectAllBatches = (state: RootState): BatchTxsState => {
  return state[batchSlice.name] || initialState
}

export const selectBatchBySafe = createSelector(
  [selectAllBatches, selectChainIdAndSafeAddress],
  (allBatches, [chainId, safeAddress]): DraftBatchItem[] => {
    return allBatches[chainId]?.[safeAddress] || []
  },
)
