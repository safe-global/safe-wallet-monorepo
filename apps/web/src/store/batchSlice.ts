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

export type SafeBatchState = {
  items: DraftBatchItem[]
  // Flag indicating the batch is being confirmed and should not be shown in UI
  isConfirming: boolean
}

export type BatchTxsState = {
  [chainId: string]: {
    [safeAddress: string]: SafeBatchState
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
      state[chainId][safeAddress] = state[chainId][safeAddress] || { items: [], isConfirming: false }

      const batchState = state[chainId][safeAddress]

      // If batch is being confirmed, clear it and start fresh
      if (batchState.isConfirming) {
        batchState.items = []
        batchState.isConfirming = false
      }

      batchState.items.push({
        id: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
        txData,
      })
    },

    // Remove a tx from the batch by id
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
      const batchState = state[chainId][safeAddress]
      if (batchState) {
        batchState.items = batchState.items.filter((item) => item.id !== id)
      }
    },

    // Mark the batch as being confirmed (hide from UI but don't delete yet)
    setBatchConfirming: (
      state,
      action: PayloadAction<{
        chainId: string
        safeAddress: string
        isConfirming: boolean
      }>,
    ) => {
      const { chainId, safeAddress, isConfirming } = action.payload
      state[chainId] = state[chainId] || {}
      const batchState = state[chainId][safeAddress]
      if (batchState) {
        batchState.isConfirming = isConfirming
      }
    },

    // Clear the entire batch (used after successful confirmation)
    clearBatch: (
      state,
      action: PayloadAction<{
        chainId: string
        safeAddress: string
      }>,
    ) => {
      const { chainId, safeAddress } = action.payload
      if (state[chainId]?.[safeAddress]) {
        state[chainId][safeAddress] = { items: [], isConfirming: false }
      }
    },
  },
})

export const { addTx, removeTx, setBatchConfirming, clearBatch } = batchSlice.actions

const selectAllBatches = (state: RootState): BatchTxsState => {
  return state[batchSlice.name] || initialState
}

export const selectBatchBySafe = createSelector(
  [selectAllBatches, selectChainIdAndSafeAddress],
  (allBatches, [chainId, safeAddress]): DraftBatchItem[] => {
    const batchState = allBatches[chainId]?.[safeAddress]

    if (!batchState) {
      return []
    }

    // Handle old array format (pre-migration)
    if (Array.isArray(batchState)) {
      return batchState
    }

    // Handle new SafeBatchState format
    // Don't return items if the batch is being confirmed
    if (batchState.isConfirming) {
      return []
    }

    return batchState.items || []
  },
)
