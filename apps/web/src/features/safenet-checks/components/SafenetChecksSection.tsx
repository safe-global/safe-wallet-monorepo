import { useContext, type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { STATUS_PRESENTATION, UNAVAILABLE_PRESENTATION } from '../statusPresentation'

/**
 * Safenet check state as a section in the Safe Shield widget (PRD display
 * rule: reuse the severity components, no new banner UI). Subscribes only for
 * confirm/execute flows of an already-proposed transaction, and only once the
 * submission time is known — the shared cache keys by hash, so a fetch aimed
 * without it would cache a mis-aimed read for every surface.
 *
 * This is the one surface that renders UNAVAILABLE, split per RFC W10 into "no
 * check was requested" and "the status could not be read"; the queue row and
 * the audit row stay silent for both.
 */
export const SafenetChecksSection = (): ReactElement | null => {
  const { txId, txDetails } = useContext(TxFlowContext)
  const safeTxHash = txId ? getSafeTxHashFromTxId(txId) : undefined
  const submittedAt =
    txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
      ? txDetails.detailedExecutionInfo.submittedAt
      : undefined

  const { publicStatus, snapshot, unavailableReason } = useSafenetCheck(
    submittedAt !== undefined ? safeTxHash : undefined,
    submittedAt,
  )

  // A pinned verdict without its snapshot renders nothing — the refetch
  // restores the snapshot within one poll.
  const unavailable =
    publicStatus === CheckStatus.UNAVAILABLE && unavailableReason
      ? UNAVAILABLE_PRESENTATION[unavailableReason]
      : undefined
  const verdict = publicStatus !== CheckStatus.UNAVAILABLE && snapshot ? STATUS_PRESENTATION[publicStatus] : undefined
  const content = unavailable ?? verdict
  if (!content) return null

  return (
    // The section appears only once the chain read resolves; the entrance
    // animation softens the late insert instead of popping it in one frame.
    <div
      data-testid="safenet-checks-section"
      data-status={publicStatus}
      data-reason={unavailableReason}
      className="animate-in fade-in slide-in-from-top-1 p-4 duration-300"
    >
      <div className="flex items-start gap-2">
        <SeverityIcon severity={verdict?.severity ?? Severity.INFO} muted={verdict === undefined} />
        {/* paragraph-small renders a span; the flex column is what puts the copy on its own line. */}
        <div className="flex flex-1 flex-col gap-1">
          <Typography variant="paragraph-small" className="font-bold leading-4">
            {unavailable?.title ?? 'Safenet check'}
          </Typography>
          <Typography variant="paragraph-small" className="text-muted-foreground">
            {content.copy}
          </Typography>
        </div>
      </div>
    </div>
  )
}

export default SafenetChecksSection
