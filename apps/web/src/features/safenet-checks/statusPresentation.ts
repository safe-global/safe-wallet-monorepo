import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'

type SafenetStatusPresentation = {
  /** Safe Shield severity vocabulary — drives SeverityIcon and its colors. */
  severity: Severity
  /** Short state name (PRD states table) for compact placements. */
  label: string
  /** Full-sentence copy (PRD states table, verbatim) for the flow surface. */
  copy: string
}

/** The PRD "States & Warnings" table. UNAVAILABLE renders nothing everywhere. */
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
