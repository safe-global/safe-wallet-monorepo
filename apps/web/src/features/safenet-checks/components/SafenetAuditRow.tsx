import type { ReactElement } from 'react'
import { AuditRow, type ActionType } from '@/components/common/AuditLog'
import ExternalLink from '@/components/common/ExternalLink'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useChain } from '@/hooks/useChains'
import {
  CheckStatus,
  SAFENET_EXPLORER_URL,
  verdictAttestation,
  type PublicCheckStatus,
} from '@safe-global/utils/features/safenet-checks'
import { useSafenetDisplayStatus } from '../useSafenetDisplayStatus'
import { STATUS_PRESENTATION } from '../statusPresentation'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'

const STEP_ICON: Record<Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, ActionType> = {
  [CheckStatus.SUBMITTED]: 'pending',
  [CheckStatus.IN_PROGRESS]: 'pending',
  [CheckStatus.BENIGN]: 'confirmed',
  [CheckStatus.MALICIOUS]: 'expired',
  [CheckStatus.TIMED_OUT]: 'expired',
}

// Dark mode only — in light mode every status follows the sibling rows' default color.
const DARK_STEP_COLOR: Record<Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, string> = {
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

/**
 * Safenet step in the transaction audit log: "Simulating / No issues found /
 * Risk detected · By Safenet", where "Safenet" links the attestation
 * transaction once the check is verified. Renders nothing until a check has
 * been observed — most transactions never had one. Dated from the attested
 * block on the Safenet chain; the row stays in lifecycle position, so its
 * date may read later than Executed below it.
 */
export const SafenetAuditRow = ({
  safeTxHash,
  chainId,
  timestampMs,
  isLast,
}: SafenetAuditRowProps): ReactElement | null => {
  const display = useSafenetDisplayStatus(safeTxHash, timestampMs)
  // The Safenet chain (the chain the attestation landed on), not the Safe's.
  const safenetChain = useChain(display?.snapshot.chainId ?? '')
  const isDarkMode = useDarkMode()

  if (!safeTxHash || !display) return null
  const { publicStatus, snapshot } = display

  // Link only on BENIGN: it is underivable without a FROST-verified
  // attestation, so "No issues found" and the proof link always travel together.
  const isVerified = publicStatus === CheckStatus.BENIGN

  // Point at the transaction that carried the attestation this verdict came
  // from, on the Safenet chain's block explorer. The Safenet explorer's hash
  // route is the fallback when the chain config is unavailable.
  const attested = verdictAttestation(snapshot)
  const attestationTxLink =
    attested && safenetChain ? getExplorerLink(attested.transactionHash, safenetChain.blockExplorerUriTemplate) : null
  const href = attestationTxLink?.href ?? `${SAFENET_EXPLORER_URL}/#/safeTx?chainId=${chainId}&safeTxHash=${safeTxHash}`

  return (
    // The row appears only once the chain read resolves; the entrance
    // animation softens the late insert instead of popping it in one frame.
    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
      <AuditRow
        label={STATUS_PRESENTATION[publicStatus].label}
        actionType={STEP_ICON[publicStatus]}
        iconColor={isDarkMode ? DARK_STEP_COLOR[publicStatus] : undefined}
        actor={
          // Theme-default link color, matching the sibling rows.
          isVerified ? (
            <ExternalLink data-testid="safenet-attestation-link" href={href} noIcon>
              Safenet
            </ExternalLink>
          ) : (
            'Safenet'
          )
        }
        isLast={isLast}
        // Null while running or when the header read failed — column stays empty.
        timestamp={snapshot.attestedAtMs ?? null}
      />
    </div>
  )
}

export default SafenetAuditRow
