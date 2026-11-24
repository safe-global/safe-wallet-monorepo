import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

/**
 * Whether the first onboarding step may offer the saved draft. Not persisted: it is about this visit to the wizard only.
 * `unknown` until a step opens, and again once the user leaves the wizard; `offer` when the wizard opened on its first
 * step; `done` once the user answered the offer or moved past the first step, because Back from step 2 is not a new
 * start.
 */
type ResumeOffer = 'unknown' | 'offer' | 'done'

type WorkspaceWizardState = { resumeOffer: ResumeOffer }

const initialState: WorkspaceWizardState = { resumeOffer: 'unknown' }

export const workspaceWizardSlice = createSlice({
  name: 'workspaceWizard',
  initialState,
  reducers: {
    wizardStepOpened: (state, { payload: isFirstStep }: PayloadAction<boolean>) => {
      if (state.resumeOffer === 'unknown') state.resumeOffer = isFirstStep ? 'offer' : 'done'
      else if (!isFirstStep) state.resumeOffer = 'done'
    },
    resumeOfferAnswered: (state) => {
      state.resumeOffer = 'done'
    },
    wizardLeft: (state) => {
      state.resumeOffer = 'unknown'
    },
  },
})

export const { wizardStepOpened, resumeOfferAnswered, wizardLeft } = workspaceWizardSlice.actions

export const selectIsResumeOffered = (state: RootState): boolean =>
  state[workspaceWizardSlice.name].resumeOffer === 'offer'
