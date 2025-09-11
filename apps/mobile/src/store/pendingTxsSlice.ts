import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.'

export enum PendingStatus {
  PROCESSING = 'PROCESSING',
  INDEXING = 'INDEXING',
  SUCCESS = 'SUCCESS',
}

export type PendingTx = {
  chainId: string
  safeAddress: string
  txHash: string
  walletAddress: string
  walletNonce: number
  status: PendingStatus
}

export type PendingTxsState = Record<string, PendingTx>

const initialState: PendingTxsState = {}

export const pendingTxsSlice = createSlice({
  name: 'pendingTxs',
  initialState,
  reducers: {
    addPendingTx: (
      state,
      action: PayloadAction<{
        txId: string
        chainId: string
        safeAddress: string
        txHash: string
        walletAddress: string
        walletNonce: number
      }>,
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
    clearPendingTx: (state, action: PayloadAction<{ txId: string }>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[action.payload.txId]
    },
  },
})

export const { addPendingTx, setPendingTxStatus, clearPendingTx } = pendingTxsSlice.actions

export const selectPendingTxs = (state: RootState): PendingTxsState => state[pendingTxsSlice.name]

export const selectPendingTxById = (state: RootState, txId: string): PendingTx | undefined =>
  selectPendingTxs(state)[txId]

export default pendingTxsSlice.reducer
