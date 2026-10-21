import type { ReactElement } from 'react'
import { AuditRow, type ActionType } from '@/components/common/AuditLog'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { useDarkMode } from '@/hooks/useDarkMode'
import {
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { useSafenetDisplayStatus, type ShownUnavailableReason } from '../useSafenetDisplayStatus'
import { STATUS_PRESENTATION, UNAVAILABLE_PRESENTATION } from '../statusPresentation'
import { useSafenetLinks } from '../useSafenetLinks'
import { SAFENET_ATTESTATION_LINK_LABEL, SAFENET_EXPLORER_LINK_LABEL } from './SafenetLinks'

type VerdictStatus = Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>

const STEP_ICON: Record<VerdictStatus, ActionType> = {
  [CheckStatus.SUBMITTED]: 'pending',
  [CheckStatus.IN_PROGRESS]: 'pending',
  [CheckStatus.BENIGN]: 'confirmed',
  [CheckStatus.MALICIOUS]: 'expired',
  [CheckStatus.TIMED_OUT]: 'expired',
}

// Dark mode only — in light mode every status follows the sibling rows' default color.
const DARK_STEP_COLOR: Record<VerdictStatus, string> = {
  [CheckStatus.SUBMITTED]: 'var(--color-text-secondary)',
  [CheckStatus.IN_PROGRESS]: 'var(--color-info-main)',
  [CheckStatus.BENIGN]: 'var(--color-primary-main)',
  [CheckStatus.MALICIOUS]: 'var(--color-error-main)',
  [CheckStatus.TIMED_OUT]: 'var(--color-warning-main)',
}

// Neutral in dark mode; light mode keeps the sibling rows' default color.
const UNAVAILABLE_STEP_COLOR = 'var(--color-text-secondary)'

// The row appears only once the chain read resolves; the entrance animation
// softens the late insert instead of popping it in one frame.
const STEP_ENTRANCE = 'animate-in fade-in slide-in-from-top-1 duration-300'

export type SafenetAuditRowProps = {
  safeTxHash: string | undefined
  /** The Safe's home chain id — the Safenet explorer indexes checks by it. */
  chainId: string
  /** Submission (proposal) time; aims the reader's block window. */
  timestampMs?: number | null
  isLast?: boolean
}

export type SafenetAuditRowViewProps = {
  publicStatus: VerdictStatus
  snapshot: SafenetCheckSnapshot
  safeTxHash: string
  chainId: string
  timestampMs?: number | null
  isLast?: boolean
}

/** Safenet audit-log step, dated from the attested or deadline block — can read later than Executed. */
export const SafenetAuditRowView = ({
  publicStatus,
  snapshot,
  safeTxHash,
  chainId,
  isLast,
}: SafenetAuditRowViewProps): ReactElement => {
  const isDarkMode = useDarkMode()
  const label = STATUS_PRESENTATION[publicStatus].label
  const { attestationHref, explorerHref } = useSafenetLinks(publicStatus, snapshot, chainId, safeTxHash)

  const actor = attestationHref ? (
    <ExternalLink
      data-testid="safenet-attestation-link"
      href={attestationHref}
      aria-label={SAFENET_ATTESTATION_LINK_LABEL}
      noIcon
    >
      Safenet
    </ExternalLink>
  ) : publicStatus === CheckStatus.MALICIOUS || publicStatus === CheckStatus.BENIGN ? (
    <ExternalLink
      data-testid="safenet-explorer-link"
      href={explorerHref}
      aria-label={SAFENET_EXPLORER_LINK_LABEL}
      noIcon
    >
      Safenet
    </ExternalLink>
  ) : (
    'Safenet'
  )

  return (
    <div className={STEP_ENTRANCE}>
      <AuditRow
        label={label}
        actionType={STEP_ICON[publicStatus]}
        iconColor={isDarkMode ? DARK_STEP_COLOR[publicStatus] : undefined}
        actor={actor}
        isLast={isLast}
        // Null while running or when the header read failed — column stays empty.
        timestamp={snapshot.attestedAtMs ?? snapshot.timedOutAtMs ?? null}
      />
    </div>
  )
}

export type SafenetUnavailableAuditRowViewProps = {
  reason: ShownUnavailableReason
  isLast?: boolean
}

/** Audit-log step for a check that could not be read: no verdict, no date, no link. */
export const SafenetUnavailableAuditRowView = ({
  reason,
  isLast,
}: SafenetUnavailableAuditRowViewProps): ReactElement => {
  const isDarkMode = useDarkMode()

  return (
    <div className={STEP_ENTRANCE}>
      <AuditRow
        label={UNAVAILABLE_PRESENTATION[reason].label}
        actionType="pending"
        iconColor={isDarkMode ? UNAVAILABLE_STEP_COLOR : undefined}
        actor="Safenet"
        isLast={isLast}
      />
    </div>
  )
}

/** Renders nothing until a check is observed or its read fails — most transactions never had one. */
export const SafenetAuditRow = ({
  safeTxHash,
  chainId,
  timestampMs,
  isLast,
}: SafenetAuditRowProps): ReactElement | null => {
  const display = useSafenetDisplayStatus(safeTxHash, timestampMs)
  if (!safeTxHash || !display) return null
  if (display.publicStatus === CheckStatus.UNAVAILABLE) {
    return <SafenetUnavailableAuditRowView reason={display.unavailableReason} isLast={isLast} />
  }

  return (
    <SafenetAuditRowView
      publicStatus={display.publicStatus}
      snapshot={display.snapshot}
      safeTxHash={safeTxHash}
      chainId={chainId}
      timestampMs={timestampMs}
      isLast={isLast}
    />
  )
}

export default SafenetAuditRow
