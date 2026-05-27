import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export enum ESafeAction {
  Send = 'send',
  Receive = 'receive',
  Swap = 'swap',
  BuildTransaction = 'buildTransaction',
  SpendingLimit = 'spendingLimit',
}

interface SafeActionsModalState {
  opened: boolean
  type: ESafeAction
}

const initialState: SafeActionsModalState = {
  opened: false,
  type: ESafeAction.Send,
}

export const safeActionsModalSlice = createSlice({
  name: 'safeActionsModal',
  initialState,
  reducers: {
    openSafeActionsModal: (state, action: PayloadAction<{ type: ESafeAction }>) => {
      state.opened = true
      state.type = action.payload.type
    },
    closeSafeActionsModal: (state) => {
      state.opened = false
    },
  },
})

export const { openSafeActionsModal, closeSafeActionsModal } = safeActionsModalSlice.actions

export const selectSafeActionsModal = (state: RootState) => state[safeActionsModalSlice.name]
export const selectSafeActionsModalOpen = (state: RootState) => state[safeActionsModalSlice.name].opened
export const selectSafeActionsModalType = (state: RootState) => state[safeActionsModalSlice.name].type
