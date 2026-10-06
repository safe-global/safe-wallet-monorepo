import type { ReactElement } from 'react'
import { AuditRow, type ActionType } from '@/components/common/AuditLog'
import ExternalLink from '@/components/common/ExternalLink'
import { useDarkMode } from '@/hooks/useDarkMode'
import {
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { useSafenetDisplayStatus } from '../useSafenetDisplayStatus'
import { STATUS_PRESENTATION } from '../statusPresentation'
import { formatSimulatingLabel } from '../checkTiming'
import { useCheckTiming } from '../useCheckTiming'
import { useSafenetLinks } from '../useSafenetLinks'

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

const useStepLabel = (
  publicStatus: VerdictStatus,
  snapshot: SafenetCheckSnapshot,
  timestampMs: number | null | undefined,
): string => {
  const timing = useCheckTiming(snapshot, timestampMs)
  if (publicStatus === CheckStatus.IN_PROGRESS) return formatSimulatingLabel(timing)
  return STATUS_PRESENTATION[publicStatus].label
}

/** Safenet audit-log step. Dated from the attested block, so it can read later than Executed below it. */
export const SafenetAuditRowView = ({
  publicStatus,
  snapshot,
  safeTxHash,
  chainId,
  timestampMs,
  isLast,
}: SafenetAuditRowViewProps): ReactElement => {
  const isDarkMode = useDarkMode()
  const label = useStepLabel(publicStatus, snapshot, timestampMs)
  const { attestationHref, explorerHref } = useSafenetLinks(publicStatus, snapshot, chainId, safeTxHash)

  const actor = attestationHref ? (
    <ExternalLink data-testid="safenet-attestation-link" href={attestationHref} aria-label="View attestation" noIcon>
      Safenet
    </ExternalLink>
  ) : publicStatus === CheckStatus.MALICIOUS ? (
    <ExternalLink data-testid="safenet-explorer-link" href={explorerHref} aria-label="View on Safenet explorer" noIcon>
      Safenet
    </ExternalLink>
  ) : (
    'Safenet'
  )

  return (
    // The row appears only once the chain read resolves; the entrance
    // animation softens the late insert instead of popping it in one frame.
    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
      <AuditRow
        label={label}
        actionType={STEP_ICON[publicStatus]}
        iconColor={isDarkMode ? DARK_STEP_COLOR[publicStatus] : undefined}
        actor={actor}
        isLast={isLast}
        // Null while running or when the header read failed — column stays empty.
        timestamp={snapshot.attestedAtMs ?? null}
      />
    </div>
  )
}

/** Renders nothing until a check has been observed — most transactions never had one. */
export const SafenetAuditRow = ({
  safeTxHash,
  chainId,
  timestampMs,
  isLast,
}: SafenetAuditRowProps): ReactElement | null => {
  const display = useSafenetDisplayStatus(safeTxHash, timestampMs)
  if (!safeTxHash || !display) return null

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
