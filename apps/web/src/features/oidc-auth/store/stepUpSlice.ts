import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'

export type StepUpPhase = 'idle' | 'leaving' | 'returning'

type StepUpState = {
  phase: StepUpPhase
  /** Where the challenge returns the user; the current page when unset. */
  returnUrl?: string
}

const initialState: StepUpState = {
  phase: 'idle',
}

export const stepUpSlice = createSlice({
  name: 'stepUp',
  initialState,
  reducers: {
    stepUpLeaving: (state) => {
      state.phase = 'leaving'
    },
    stepUpReturning: (state) => {
      state.phase = 'returning'
    },
    stepUpSettled: (state) => {
      state.phase = 'idle'
    },
    stepUpReturnUrlSet: (state, action: PayloadAction<string>) => {
      state.returnUrl = action.payload
    },
    // Only clears its own URL, so an unmounting page cannot drop the one the next page just set.
    stepUpReturnUrlCleared: (state, action: PayloadAction<string>) => {
      if (state.returnUrl === action.payload) state.returnUrl = undefined
    },
  },
})

export const { stepUpLeaving, stepUpReturning, stepUpSettled, stepUpReturnUrlSet, stepUpReturnUrlCleared } =
  stepUpSlice.actions

export const selectStepUpPhase = (state: RootState): StepUpPhase => state.stepUp.phase

export const selectStepUpReturnUrl = (state: RootState): string | undefined => state.stepUp.returnUrl
