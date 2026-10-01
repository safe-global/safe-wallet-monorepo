/** Every state a Safenet surface can show in the M1 prototype. */
export type SafenetCheckPhase =
  | 'before-sign'
  | 'submitted'
  | 'checking'
  | 'no-issues'
  | 'risk'
  | 'unavailable'
  | 'locked'

/** States the check itself can be in once a signature has been submitted. */
export type SafenetCheckOutcome = Extract<
  SafenetCheckPhase,
  'submitted' | 'checking' | 'no-issues' | 'risk' | 'unavailable'
>

export type SafenetSignerRole = 'first-signer' | 'co-signer' | 'executor' | 'single-owner'

export type SafenetScenarioTiming = 'instant' | 'about-60s' | 'never'

export type SafenetCheckState = {
  phase: SafenetCheckPhase
  /** When the first signature was submitted and the check started. */
  startedAtMs?: number
  /** Expected verdict time, only while checking. */
  etaMs?: number
  /** Why Safenet flagged the transaction, only for `risk`. */
  riskDetails?: string
}

export type SafenetScenario = {
  /** `auto` derives the role from the tx flow the viewer is in. */
  role: SafenetSignerRole | 'auto'
  outcome: SafenetCheckOutcome
  timing: SafenetScenarioTiming
  enhancedExecution: boolean
  startedAtMs?: number
}
