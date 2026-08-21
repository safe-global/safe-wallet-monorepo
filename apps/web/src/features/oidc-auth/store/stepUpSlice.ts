import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'

/**
 * `leaving` covers the moment between CGW rejecting a gated action and the
 * browser actually navigating to the provider; `returning` covers reconciling
 * the elevated session and completing the interrupted action on the way back.
 */
export type StepUpPhase = 'idle' | 'leaving' | 'returning'

type StepUpState = {
  phase: StepUpPhase
}

const initialState: StepUpState = {
  phase: 'idle',
}

/**
 * Drives the step-up splash screen. Intentionally not persisted: a step-up
 * belongs to the session in flight, so a stale phase must never survive a
 * reload and leave the user behind a splash.
 */
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
