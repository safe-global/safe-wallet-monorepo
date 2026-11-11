import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

type HnSessionState = {
  rejectedAuthorization?: string
}

const initialState: HnSessionState = {}

export const hnSessionSlice = createSlice({
  name: 'hnSession',
  initialState,
  reducers: {
    hnSessionRejected: (state, { payload }: PayloadAction<string>) => {
      state.rejectedAuthorization = payload
    },
    hnSessionRejectionCleared: (state) => {
      delete state.rejectedAuthorization
    },
  },
})

export const { hnSessionRejected, hnSessionRejectionCleared } = hnSessionSlice.actions

export const selectRejectedHypernativeAuthorization = (state: RootState): string | undefined =>
  state[hnSessionSlice.name]?.rejectedAuthorization
