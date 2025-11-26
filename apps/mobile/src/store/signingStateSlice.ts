import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/src/store'

interface SigningState {
  status: 'signing' | 'success' | 'error'
  startedAt?: number
  completedAt?: number
  error?: string
}

interface SigningStateSlice {
  signings: Record<string, SigningState>
}

const initialState: SigningStateSlice = {
  signings: {},
}

/**
 * Redux slice for tracking transaction signing state.
 */
export const signingStateSlice = createSlice({
  name: 'signingState',
  initialState,
  reducers: {
    startSigning: (state, action: PayloadAction<string>) => {
      const txId = action.payload
      state.signings[txId] = {
        status: 'signing',
        startedAt: Date.now(),
      }
    },

    setSigningSuccess: (state, action: PayloadAction<string>) => {
      const txId = action.payload
      if (state.signings[txId]) {
        state.signings[txId].status = 'success'
        state.signings[txId].completedAt = Date.now()
      }
    },

    setSigningError: (state, action: PayloadAction<{ txId: string; error: string }>) => {
      const { txId, error } = action.payload
      if (state.signings[txId]) {
        state.signings[txId].status = 'error'
        state.signings[txId].completedAt = Date.now()
        state.signings[txId].error = error
      }
    },

    clearSigning: (state, action: PayloadAction<string>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state.signings[action.payload]
    },
  },
})

export const { startSigning, setSigningSuccess, setSigningError, clearSigning } = signingStateSlice.actions

export const selectSigningState = (state: RootState, txId: string) => state.signingState.signings[txId]

export default signingStateSlice.reducer
