import { Severity } from '@safe-global/utils/features/safe-shield/types'
import {
  CheckStatus,
  SAFENET_EXPLORER_URL,
  type PublicCheckStatus,
  type UnavailableReason,
} from '@safe-global/utils/features/safenet-checks'

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
    copy: 'Check submitted to Safenet. It takes about a minute.',
  },
  [CheckStatus.IN_PROGRESS]: {
    severity: Severity.INFO,
    label: 'Simulating',
    copy: 'Safenet is simulating this transaction. It takes about a minute.',
  },
  [CheckStatus.BENIGN]: {
    severity: Severity.OK,
    label: 'No issues found',
    copy: 'Safenet found no issues.',
  },
  [CheckStatus.MALICIOUS]: {
    severity: Severity.CRITICAL,
    label: 'Risk detected',
    copy: 'Safenet flagged this transaction as malicious.',
  },
  [CheckStatus.TIMED_OUT]: {
    severity: Severity.ERROR,
    label: 'Safenet check failed',
    copy: "Safenet couldn't reach a trusted result for this transaction. You can still continue.",
  },
}

/**
 * None of the three UNAVAILABLE meanings is a verdict, so all stay neutral: a
 * muted icon and the default text colors, never error or warning ones. No
 * severity field: these states have no verdict to color from.
 */
export const UNAVAILABLE_PRESENTATION: Record<UnavailableReason, Pick<SafenetStatusPresentation, 'label' | 'copy'>> = {
  NO_CHECK: {
    label: 'Not checked',
    copy: 'No Safenet check was requested for this transaction.',
  },
  READ_FAILED: {
    label: "Couldn't read Safenet status",
    copy: "We couldn't reach Safenet to read this check. We'll keep trying. You can still continue.",
  },
  // Found nothing where it looked, which never proves that no check was requested.
  WINDOW_UNCERTAIN: {
    label: 'Safenet status unknown',
    copy: "We couldn't confirm whether Safenet checked this transaction. You can still continue.",
  },
}

/** Shown before the first signature, while no check exists yet. */
export const PRE_CHECK_COPY = {
  label: 'Safenet check',
  copy: 'Safenet checks this transaction after you sign. It takes about a minute.',
  waiting: 'You can sign now and come back to execute. The result will be ready for the next signer.',
  about: "Independent sentinels simulate the transaction and check it against Safenet's security rules.",
}

export const IN_FLIGHT_NOTE = "You don't have to wait for the result to sign."

export const STALE_NOTE = 'Status may be out of date.'

export const MULTIPLE_RULES_TITLE = 'Malicious threats detected'

export const SAFENET_DOCS_URL = 'https://docs.safefoundation.org/safenet'

/** The check's page on the Safenet explorer — per-sentinel detail, not proof of a verdict. */
export const getSafenetExplorerUrl = (chainId: string, safeTxHash: string): string =>
  `${SAFENET_EXPLORER_URL}/#/safeTx?chainId=${chainId}&safeTxHash=${safeTxHash}`

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
