import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

export enum PendingStatus {
  PROCESSING = 'PROCESSING',
  INDEXING = 'INDEXING',
  SUCCESS = 'SUCCESS',
}

export type PendingSingleTx = {
  type: ExecutionMethod.WITH_PK
  chainId: string
  safeAddress: string
  txHash: string
  walletAddress: string
  walletNonce: number
  status: PendingStatus
}

export type PendingRelayTx = {
  type: ExecutionMethod.WITH_RELAY
  taskId: string
  txHash?: string
  chainId: string
  safeAddress: string
  status: PendingStatus
}

export type PendingTx = PendingSingleTx | PendingRelayTx

export type PendingTxsState = Record<string, PendingTx>

const initialState: PendingTxsState = {}

export const pendingTxsSlice = createSlice({
  name: 'pendingTxs',
  initialState,
  reducers: {
    addPendingTx: (
      state,
      action: PayloadAction<
        | {
            txId: string
            type: ExecutionMethod.WITH_PK
            chainId: string
            safeAddress: string
            txHash: string
            walletAddress: string
            walletNonce: number
          }
        | {
            txId: string
            type: ExecutionMethod.WITH_RELAY
            taskId: string
            chainId: string
            safeAddress: string
          }
      >,
    ) => {
      const { txId, ...tx } = action.payload
      state[txId] = { ...tx, status: PendingStatus.PROCESSING }
    },
    setPendingTxStatus: (state, action: PayloadAction<{ txId: string; chainId: string; status: PendingStatus }>) => {
      const { txId, status } = action.payload

      if (state[txId]) {
        state[txId].status = status
      }
    },
    setRelayTxHash: (state, action: PayloadAction<{ txId: string; txHash: string }>) => {
      const { txId, txHash } = action.payload
      const tx = state[txId]

      if (tx && tx.type === ExecutionMethod.WITH_RELAY) {
        // Convert relay tx to single tx once we have the hash
        state[txId] = {
          ...tx,
          txHash,
        }
      }
    },
    clearPendingTx: (state, action: PayloadAction<{ txId: string }>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[action.payload.txId]
    },
  },
})

export const { addPendingTx, setPendingTxStatus, setRelayTxHash, clearPendingTx } = pendingTxsSlice.actions

export const selectPendingTxs = (state: RootState): PendingTxsState => state[pendingTxsSlice.name]

export const selectPendingTxById = (state: RootState, txId: string): PendingTx | undefined =>
  selectPendingTxs(state)[txId]

export default pendingTxsSlice.reducer
