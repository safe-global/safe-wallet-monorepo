import { type RootState } from '@/store'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type PendingCfDelete = {
  chainId: string
  address: string
}

type PendingCfDeletesState = PendingCfDelete[]

const initialState: PendingCfDeletesState = []

const matches = (entry: PendingCfDelete, target: PendingCfDelete) =>
  entry.chainId === target.chainId && entry.address === target.address

export const pendingCfDeletesSlice = createSlice({
  name: 'pendingCfDeletes',
  initialState,
  reducers: {
    enqueuePendingCfDelete: (state, action: PayloadAction<PendingCfDelete>) => {
      if (state.some((entry) => matches(entry, action.payload))) return state
      state.push(action.payload)
    },

    removePendingCfDelete: (state, action: PayloadAction<PendingCfDelete>) => {
      return state.filter((entry) => !matches(entry, action.payload))
    },

    clearPendingCfDeletes: () => initialState,
  },
})

export const { enqueuePendingCfDelete, removePendingCfDelete, clearPendingCfDeletes } = pendingCfDeletesSlice.actions

export const selectPendingCfDeletes = (state: RootState): PendingCfDeletesState => {
  return state[pendingCfDeletesSlice.name]
}
