import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SafenetCheckPhase } from './types'

export type SafenetPhasePresentation = {
  severity: Severity
  /** Short state name for compact placements: queue chip and audit log. */
  label: string
  /** Full sentence for the Shield row and the execute step. */
  copy: string
  /** Render the icon neutral: the state carries no verdict. */
  muted?: boolean
}

export const SAFENET_ROW_TITLE = 'Safenet check'

export const SAFENET_LOCKED_LABEL = 'Safenet check is off'

export const SAFENET_ETA_COPY = 'about 1 min'

export const SAFENET_OVERDUE_COPY = 'taking longer than usual'

export const SAFENET_EXPLAINER_TITLE = 'Why does this take longer?'

export const SAFENET_EXPLAINER_COPY =
  'Safenet is checked by independent checkers, not a single provider, so results take about a minute.'

export const PHASE_PRESENTATION: Record<SafenetCheckPhase, SafenetPhasePresentation> = {
  'before-sign': {
    severity: Severity.INFO,
    label: 'Checks after signing',
    copy: 'Safenet checks this transaction after you sign. It takes about a minute.',
    muted: true,
  },
  submitted: {
    severity: Severity.INFO,
    label: 'Submitted',
    copy: 'Sent to Safenet for an independent check.',
  },
  checking: {
    severity: Severity.INFO,
    label: 'Checking',
    copy: 'Independent checkers are reviewing this transaction',
  },
  'no-issues': {
    severity: Severity.OK,
    label: 'No issues found',
    copy: 'Safenet found no issues.',
  },
  risk: {
    severity: Severity.CRITICAL,
    label: 'Risk detected',
    copy: 'Safenet found a risk in this transaction.',
  },
  unavailable: {
    severity: Severity.INFO,
    label: 'Unavailable',
    copy: "Safenet couldn't check this transaction. You can still continue.",
    muted: true,
  },
  locked: {
    severity: Severity.INFO,
    label: 'Off',
    copy: 'Safenet check is off. Turn on enhanced execution to include it.',
    muted: true,
  },
}

/** `0:32`, `1:05` */
export const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** The ETA suffix for a running check: `about 1 min` until the ETA passes. */
export const getEtaCopy = (etaMs: number | undefined, nowMs: number): string =>
  etaMs !== undefined && nowMs >= etaMs ? SAFENET_OVERDUE_COPY : SAFENET_ETA_COPY

export const isRunningPhase = (phase: SafenetCheckPhase): boolean => phase === 'submitted' || phase === 'checking'

export const isVerdictPhase = (phase: SafenetCheckPhase): boolean => phase === 'no-issues' || phase === 'risk'
