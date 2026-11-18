import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'

/**
 * `prompt`: the dialog asks the user to start the verification.
 * `waiting`: the popup is open. `blocked`: the browser refused the popup.
 * `failed`: the challenge ended with an error other than a cancellation.
 */
export type StepUpStatus = 'idle' | 'prompt' | 'waiting' | 'blocked' | 'failed'

type StepUpState = {
  status: StepUpStatus
}

const initialState: StepUpState = {
  status: 'idle',
}

export const stepUpSlice = createSlice({
  name: 'stepUp',
  initialState,
  reducers: {
    stepUpRequested: (state) => {
      state.status = 'prompt'
    },
    stepUpPopupOpened: (state) => {
      state.status = 'waiting'
    },
    stepUpPopupBlocked: (state) => {
      state.status = 'blocked'
    },
    stepUpFailed: (state) => {
      state.status = 'failed'
    },
    stepUpSettled: (state) => {
      state.status = 'idle'
    },
  },
})

export const { stepUpRequested, stepUpPopupOpened, stepUpPopupBlocked, stepUpFailed, stepUpSettled } =
  stepUpSlice.actions

export const selectStepUpStatus = (state: RootState): StepUpStatus => state.stepUp.status
