import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'

export type StepUpPhase = 'idle' | 'leaving' | 'returning'

type StepUpState = {
  phase: StepUpPhase
}

const initialState: StepUpState = {
  phase: 'idle',
}

/** Not persisted: an old phase surviving a reload would leave the user stuck on the splash screen. */
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
  },
})

export const { stepUpLeaving, stepUpReturning, stepUpSettled } = stepUpSlice.actions

export const selectStepUpPhase = (state: RootState): StepUpPhase => state.stepUp.phase
