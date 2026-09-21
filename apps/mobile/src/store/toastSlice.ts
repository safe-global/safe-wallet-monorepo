import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit'
import { RootState } from '@/src/store'

export interface Toast {
  id: string
  message: string
  duration?: number
  variant?: 'error'
}

interface ToastSlice {
  queue: Toast[]
}

const initialState: ToastSlice = {
  queue: [],
}

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    // Generic, React-free way for listeners/thunks/plain code to request a toast. ToastMonitor
    // reads the queue, shows each entry, and dismisses it — the toast equivalent of the
    // signing/executing monitors, but for ephemeral notifications with no durable domain state.
    showToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.queue.push(action.payload)
      },
      prepare: (toast: Omit<Toast, 'id'>) => ({ payload: { id: nanoid(), ...toast } }),
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((toast) => toast.id !== action.payload)
    },
  },
})

export const { showToast, dismissToast } = toastSlice.actions

export const selectToastQueue = (state: RootState) => state.toast.queue

export default toastSlice.reducer
