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
    copy: 'Submitted to Safenet. Takes about a minute.',
  },
  [CheckStatus.IN_PROGRESS]: {
    severity: Severity.INFO,
    label: 'Simulating',
    copy: 'Safenet is simulating this transaction.',
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

/** One line on what Safenet is, for states whose title already says the result. */
export const SAFENET_BLURB = 'Independent sentinels simulate each transaction and check it for known risks.'

/** Shown before the first signature, while no check exists yet. */
export const SAFENET_ABOUT =
  "Independent sentinels simulate this transaction and check it against Safenet's security rules."

export const PRE_CHECK_COPY = {
  multisig: 'The check starts after you sign and takes about a minute. The next signer will see the result.',
  single: "The check starts after you sign and takes about a minute. Execute from the queue once it's in.",
  executeNow:
    'The check starts after you sign and takes about a minute. Choose "No, later" to see the result before executing.',
}

/** Compact queue-chip labels; the full state name stays in the tooltip and screen-reader copy. */
export const CHIP_LABEL: Record<Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, string> = {
  [CheckStatus.SUBMITTED]: 'Submitted',
  [CheckStatus.IN_PROGRESS]: 'Simulating',
  [CheckStatus.BENIGN]: 'No issues found',
  [CheckStatus.MALICIOUS]: 'Risk detected',
  [CheckStatus.TIMED_OUT]: 'Check failed',
}

/** Chip colour per state, shared by the queue row and the details card. */
export const CHIP_VARIANT = {
  [CheckStatus.SUBMITTED]: 'info',
  [CheckStatus.IN_PROGRESS]: 'info',
  [CheckStatus.BENIGN]: 'positive',
  [CheckStatus.MALICIOUS]: 'negative',
  [CheckStatus.TIMED_OUT]: 'warning',
} as const satisfies Record<Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, string>

export const STALE_NOTE = 'Status may be out of date.'

export const MULTIPLE_RULES_TITLE = 'Malicious threats detected'

export const SAFENET_DOCS_URL = 'https://docs.safefoundation.org/safenet'

/** The check's page on the Safenet explorer — per-sentinel detail, not proof of a verdict. */
export const getSafenetExplorerUrl = (chainId: string, safeTxHash: string): string =>
  `${SAFENET_EXPLORER_URL}/#/safeTx?chainId=${chainId}&safeTxHash=${safeTxHash}`

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

  return { ...STATUS_PRESENTATION[publicStatus], muted: false }
}
