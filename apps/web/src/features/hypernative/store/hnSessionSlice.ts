import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

type HnSessionState = {
  rejectedToken?: string
}

const initialState: HnSessionState = {}

export const hnSessionSlice = createSlice({
  name: 'hnSession',
  initialState,
  reducers: {
    hnSessionRejected: (state, { payload }: PayloadAction<string>) => {
      state.rejectedToken = payload
    },
    hnSessionRejectionCleared: (state) => {
      delete state.rejectedToken
    },
  },
})

export const { hnSessionRejected, hnSessionRejectionCleared } = hnSessionSlice.actions

export const selectRejectedHypernativeToken = (state: RootState): string | undefined =>
  state[hnSessionSlice.name]?.rejectedToken
