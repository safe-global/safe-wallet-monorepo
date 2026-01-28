import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'

export type QueueAssessmentsState = {
  assessments: Record<`0x${string}`, ThreatAnalysisResults | null>
}

const initialState: QueueAssessmentsState = {
  assessments: {},
}

export const hnQueueAssessmentsSlice = createSlice({
  name: 'hnQueueAssessments',
  initialState,
  reducers: {
    setAssessment: (
      state,
      { payload }: PayloadAction<{ safeTxHash: `0x${string}`; result: ThreatAnalysisResults | null }>,
    ) => {
      state.assessments[payload.safeTxHash] = payload.result
    },
    setBatchAssessments: (state, { payload }: PayloadAction<Record<`0x${string}`, ThreatAnalysisResults | null>>) => {
      state.assessments = { ...state.assessments, ...payload }
    },
    clearAssessments: (state) => {
      state.assessments = {}
    },
    removeAssessment: (state, { payload }: PayloadAction<`0x${string}`>) => {
      delete state.assessments[payload]
    },
  },
})

export const { setAssessment, setBatchAssessments, clearAssessments, removeAssessment } =
  hnQueueAssessmentsSlice.actions

export const selectQueueAssessments = (state: RootState): QueueAssessmentsState =>
  state[hnQueueAssessmentsSlice.name] || initialState

export const selectAssessment = createSelector(
  [selectQueueAssessments, (_: RootState, safeTxHash: `0x${string}`) => safeTxHash],
  (assessmentsState, safeTxHash): ThreatAnalysisResults | null | undefined => {
    return assessmentsState.assessments[safeTxHash]
  },
)

export const selectAssessments = createSelector([selectQueueAssessments], (assessmentsState) => {
  return assessmentsState.assessments
})

export const selectAssessmentsByHashes = createSelector(
  [selectQueueAssessments, (_: RootState, hashes: `0x${string}`[]) => hashes],
  (assessmentsState, hashes): Record<`0x${string}`, ThreatAnalysisResults | null | undefined> => {
    const result: Record<`0x${string}`, ThreatAnalysisResults | null | undefined> = {}
    hashes.forEach((hash) => {
      if (Object.hasOwn(assessmentsState.assessments, hash)) {
        result[hash] = assessmentsState.assessments[hash]
      }
    })
    return result
  },
)
