import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'

type QueueAssessmentsState = {
  assessments: Record<`0x${string}`, ThreatAnalysisResults | null>
}

const initialState: QueueAssessmentsState = {
  assessments: {},
}

export const hnQueueAssessmentsSlice = createSlice({
  name: 'hnQueueAssessments',
  initialState,
  reducers: {
    setBatchAssessments: (state, { payload }: PayloadAction<Record<`0x${string}`, ThreatAnalysisResults | null>>) => {
      state.assessments = { ...state.assessments, ...payload }
    },
    clearAssessments: (state) => {
      state.assessments = {}
    },
  },
})

export const { setBatchAssessments, clearAssessments } = hnQueueAssessmentsSlice.actions

const selectQueueAssessments = (state: RootState): QueueAssessmentsState =>
  state[hnQueueAssessmentsSlice.name] || initialState

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
