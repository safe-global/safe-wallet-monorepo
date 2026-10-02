import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SafenetCheckPhase, SafenetSignerRole } from './types'

export type SafenetPhasePresentation = {
  severity: Severity
  /** Short state name for compact placements: queue, transaction details and audit log. */
  label: string
  /** Sentence under the Safenet name in the Shield panel. */
  copy: string
  /** Render the icon neutral: the state carries no verdict. */
  muted?: boolean
}

/** Stands in for the Safenet logo until we have the asset. */
export const SAFENET_NAME = 'Safenet'

export const SAFENET_DETAILS_LINK = 'View details'

export const SAFENET_DETAILS_LINK_LABEL = 'View details on Safenet explorer'

export const SAFENET_LEARN_MORE_URL = 'https://safefoundation.org/safenet'

/** Kept general until the API returns individual sub-checks. */
export const SAFENET_ABOUT_COPY =
  'Independent checkers, not a single provider, review it for known threats, so results take about a minute.'

export const SAFENET_ETA_COPY = 'It takes about a minute.'

export const SAFENET_OVERDUE_COPY = "It's taking longer than usual."

export const PHASE_PRESENTATION: Record<SafenetCheckPhase, SafenetPhasePresentation> = {
  'before-sign': {
    severity: Severity.INFO,
    label: 'Checks after signing',
    copy: `Checks this transaction after you sign. ${SAFENET_ABOUT_COPY}`,
    muted: true,
  },
  submitted: {
    severity: Severity.INFO,
    label: 'Checking',
    copy: 'Sent for an independent check.',
  },
  checking: {
    severity: Severity.INFO,
    label: 'Checking',
    copy: 'Independent checkers are reviewing this transaction.',
  },
  'no-issues': {
    severity: Severity.OK,
    label: 'No issues found',
    copy: 'No issues found.',
  },
  risk: {
    severity: Severity.CRITICAL,
    label: 'Risk detected',
    copy: 'Found a risk in this transaction.',
  },
  unavailable: {
    severity: Severity.INFO,
    label: 'Unavailable',
    copy: "Couldn't check this transaction. You can still continue.",
    muted: true,
  },
  locked: {
    severity: Severity.INFO,
    label: 'Off',
    copy: 'Off. Turn on enhanced execution to include it.',
    muted: true,
  },
}

export const isRunningPhase = (phase: SafenetCheckPhase): boolean => phase === 'submitted' || phase === 'checking'

export const isVerdictPhase = (phase: SafenetCheckPhase): boolean => phase === 'no-issues' || phase === 'risk'

/** `It takes about a minute.` until the ETA passes. */
export const getEtaCopy = (etaMs: number | undefined, nowMs: number): string =>
  etaMs !== undefined && nowMs >= etaMs ? SAFENET_OVERDUE_COPY : SAFENET_ETA_COPY

const NEXT_STEP: Record<SafenetSignerRole, string> = {
  'first-signer': "You can sign now, and it'll be ready for the next signer.",
  'co-signer': "You can sign now, and it'll be ready for the next signer.",
  'final-signer': "You can sign now and come back to execute once it's done.",
  executor: "You can execute now or come back once it's done.",
}

const VERB: Record<SafenetSignerRole, string> = {
  'first-signer': 'sign',
  'co-signer': 'sign',
  'final-signer': 'sign',
  executor: 'execute',
}

/** Note above the Sign or Execute button. `isRisk` shows it as an error alert. */
export const getActionNote = (
  phase: SafenetCheckPhase,
  role: SafenetSignerRole,
  eta: { etaMs?: number; nowMs: number },
): { text: string; isRisk: boolean } => {
  switch (phase) {
    case 'before-sign':
      return role === 'executor'
        ? { text: 'Safenet checks start after signing. To wait for the result, sign without executing.', isRisk: false }
        : { text: `Safenet starts checking once you sign. ${SAFENET_ETA_COPY} ${NEXT_STEP[role]}`, isRisk: false }
    case 'submitted':
    case 'checking':
      return {
        text: `Safenet is still checking. ${getEtaCopy(eta.etaMs, eta.nowMs)} ${NEXT_STEP[role]}`,
        isRisk: false,
      }
    case 'risk':
      return { text: `Safenet found a risk in this transaction. Review it before you ${VERB[role]}.`, isRisk: true }
    default:
      return { text: `Safenet: ${PHASE_PRESENTATION[phase].copy}`, isRisk: false }
  }
}
