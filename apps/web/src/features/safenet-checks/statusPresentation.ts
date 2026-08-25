import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { CheckStatus, type PublicCheckStatus, type UnavailableReason } from '@safe-global/utils/features/safenet-checks'

export type SafenetStatusPresentation = {
  /** Safe Shield severity vocabulary — drives SeverityIcon and its colors. */
  severity: Severity
  /** Short state name for compact placements. */
  label: string
  /** Full-sentence copy for the flow surface. */
  copy: string
}

/**
 * UNAVAILABLE has no verdict presentation — see {@link UNAVAILABLE_PRESENTATION},
 * which only the flow section renders.
 */
export const STATUS_PRESENTATION: Record<
  Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>,
  SafenetStatusPresentation
> = {
  [CheckStatus.SUBMITTED]: {
    severity: Severity.INFO,
    label: 'Submitted',
    copy: 'Check submitted to Safenet.',
  },
  [CheckStatus.IN_PROGRESS]: {
    severity: Severity.INFO,
    label: 'Simulating',
    copy: 'Safenet is simulating this transaction.',
  },
  [CheckStatus.BENIGN]: {
    severity: Severity.OK,
    label: 'No issues found',
    copy: 'Safenet found no issues',
  },
  [CheckStatus.MALICIOUS]: {
    severity: Severity.CRITICAL,
    label: 'Risk detected',
    copy: 'Safenet flagged this address/transaction as malicious',
  },
  [CheckStatus.TIMED_OUT]: {
    severity: Severity.ERROR,
    label: 'Safenet check failed',
    copy: 'Safenet check is unavailable. You can still continue.',
  },
}

/**
 * Neither UNAVAILABLE meaning is a verdict, so both stay neutral: a muted icon
 * and the default text colors, never error or warning ones. No severity field:
 * these states have no verdict to color from.
 */
export const UNAVAILABLE_PRESENTATION: Record<UnavailableReason, Pick<SafenetStatusPresentation, 'label' | 'copy'>> = {
  NO_CHECK: {
    label: 'Not checked',
    copy: 'No Safenet check was requested for this transaction.',
  },
  READ_FAILED: {
    label: 'Status unavailable',
    copy: 'The Safenet check status could not be read. Retry later.',
  },
}

/** Section heading for every verdict: the state itself is in the copy. */
const VERDICT_LABEL = 'Safenet check'

export type ResolvedPresentation = SafenetStatusPresentation & {
  /** Render the icon neutral — set for the non-verdict UNAVAILABLE states. */
  muted: boolean
}

/**
 * What the flow section renders, or `undefined` for the states it must skip:
 * an unresolved first read, and a pinned verdict whose snapshot a failed
 * refetch dropped (the next poll restores it).
 */
export const resolvePresentation = (
  publicStatus: PublicCheckStatus,
  unavailableReason: UnavailableReason | undefined,
  hasSnapshot: boolean,
): ResolvedPresentation | undefined => {
  if (publicStatus === CheckStatus.UNAVAILABLE) {
    if (!unavailableReason) return undefined
    return { ...UNAVAILABLE_PRESENTATION[unavailableReason], severity: Severity.INFO, muted: true }
  }

  if (!hasSnapshot) return undefined

  return { ...STATUS_PRESENTATION[publicStatus], label: VERDICT_LABEL, muted: false }
}
