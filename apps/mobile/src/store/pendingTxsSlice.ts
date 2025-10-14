import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

export enum PendingStatus {
  PROCESSING = 'PROCESSING',
  INDEXING = 'INDEXING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

type PendingSingleTxBase = {
  type: ExecutionMethod.WITH_PK
  chainId: string
  safeAddress: string
  txHash: string
  walletAddress: string
  walletNonce: number
}

export type PendingSingleTx =
  | (PendingSingleTxBase & {
      status: PendingStatus.PROCESSING | PendingStatus.INDEXING | PendingStatus.SUCCESS
    })
  | (PendingSingleTxBase & {
      status: PendingStatus.FAILED
      error: string
    })

type PendingRelayTxBase = {
  type: ExecutionMethod.WITH_RELAY
  taskId: string
  txHash?: string
  chainId: string
  safeAddress: string
}

export type PendingRelayTx =
  | (PendingRelayTxBase & {
      status: PendingStatus.PROCESSING | PendingStatus.INDEXING | PendingStatus.SUCCESS
    })
  | (PendingRelayTxBase & {
      status: PendingStatus.FAILED
      error: string
    })

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
    setPendingTxStatus: (
      state,
      action: PayloadAction<
        | {
            txId: string
            chainId: string
            status: PendingStatus.PROCESSING | PendingStatus.INDEXING | PendingStatus.SUCCESS
          }
        | { txId: string; chainId: string; status: PendingStatus.FAILED; error: string }
      >,
    ) => {
      const { txId, status } = action.payload

      if (state[txId]) {
        if (status === PendingStatus.FAILED) {
          state[txId] = { ...state[txId], status, error: action.payload.error } as PendingTx
        } else {
          state[txId] = { ...state[txId], status } as PendingTx
        }
      }
    },
    setRelayTxHash: (state, action: PayloadAction<{ txId: string; txHash: string }>) => {
      const { txId, txHash } = action.payload
      const tx = state[txId]

      if (tx && tx.type === ExecutionMethod.WITH_RELAY) {
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
