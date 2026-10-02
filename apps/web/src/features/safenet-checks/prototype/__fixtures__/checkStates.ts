import { CHECK_ETA_MS, MOCK_RISK_DETAILS } from '../resolveCheckState'
import type { SafenetCheckPhase, SafenetCheckState } from '../types'

export const STORY_STARTED_AT_MS = 1_770_000_000_000

/** 32 seconds into the check, so running states show elapsed time against the ETA. */
export const STORY_NOW_MS = STORY_STARTED_AT_MS + 32_000

/** One fixed state per phase. The risk details are MOCK data: the M1 reason payload is unconfirmed. */
export const STORY_STATES: Record<SafenetCheckPhase, SafenetCheckState> = {
  'before-sign': { phase: 'before-sign' },
  submitted: { phase: 'submitted', startedAtMs: STORY_STARTED_AT_MS },
  checking: { phase: 'checking', startedAtMs: STORY_STARTED_AT_MS, etaMs: STORY_STARTED_AT_MS + CHECK_ETA_MS },
  'no-issues': { phase: 'no-issues', startedAtMs: STORY_STARTED_AT_MS },
  risk: { phase: 'risk', startedAtMs: STORY_STARTED_AT_MS, riskDetails: MOCK_RISK_DETAILS },
  unavailable: { phase: 'unavailable', startedAtMs: STORY_STARTED_AT_MS },
  locked: { phase: 'locked' },
}

export const MOCK_DATA_NOTE =
  'Mock data. Safenet is not called. The risk details line is a placeholder: the M1 reason payload is unconfirmed (PRD research Q10).'
