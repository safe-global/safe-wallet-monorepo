import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks/types'
import { isRunningPhase } from './copy'
import type { SafenetCheckOutcome, SafenetCheckState, SafenetScenario } from './types'

export const SUBMITTED_DURATION_MS = 3_000

export const CHECK_ETA_MS = 60_000

// MOCK: the M1 reason payload is unconfirmed (PRD research Q10). Placeholder copy only.
export const MOCK_RISK_DETAILS = '3 of 5 checkers flagged a transfer to 0x7a25…c41e, an address linked to a drainer.'

const outcomeState = (outcome: SafenetCheckOutcome, startedAtMs: number): SafenetCheckState => {
  switch (outcome) {
    case 'checking':
      return { phase: 'checking', startedAtMs, etaMs: startedAtMs + CHECK_ETA_MS }
    case 'risk':
      return { phase: 'risk', startedAtMs, riskDetails: MOCK_RISK_DETAILS }
    default:
      return { phase: outcome, startedAtMs }
  }
}

/**
 * The check state at `nowMs`. No `startedAtMs` means nobody has signed yet, so no check exists.
 * Progress is only ever submitted → checking → outcome: the middle phase may not be observable.
 */
export const resolveCheckState = (
  scenario: SafenetScenario,
  startedAtMs: number | undefined,
  nowMs: number,
  options: { isExecuted?: boolean } = {},
): SafenetCheckState => {
  if (!scenario.enhancedExecution) return { phase: 'locked' }
  if (options.isExecuted) return outcomeState(scenario.outcome, startedAtMs ?? 0)
  if (startedAtMs === undefined) return { phase: 'before-sign' }

  const outcome = outcomeState(scenario.outcome, startedAtMs)
  if (scenario.timing === 'instant' || isRunningPhase(outcome.phase)) return outcome

  const elapsedMs = nowMs - startedAtMs
  if (elapsedMs < SUBMITTED_DURATION_MS) return { phase: 'submitted', startedAtMs }
  if (scenario.timing === 'never' || elapsedMs < CHECK_ETA_MS) {
    return { phase: 'checking', startedAtMs, etaMs: startedAtMs + CHECK_ETA_MS }
  }
  return outcome
}

/** Maps the real read layer's status onto a prototype outcome — the seam for wiring up real data. */
export const fromPublicStatus = (status: PublicCheckStatus): SafenetCheckOutcome => {
  switch (status) {
    case CheckStatus.SUBMITTED:
      return 'submitted'
    case CheckStatus.IN_PROGRESS:
      return 'checking'
    case CheckStatus.BENIGN:
      return 'no-issues'
    case CheckStatus.MALICIOUS:
      return 'risk'
    default:
      return 'unavailable'
  }
}
