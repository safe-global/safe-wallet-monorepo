import type { ReactElement, ReactNode } from 'react'
import classNames from 'classnames'
import { Typography } from '@/components/ui/typography'
import MaliciousTxWarning from '@/components/transactions/MaliciousTxWarning'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import TxProposalChip from '@/features/proposers/components/TxProposalChip'
import { ellipsis } from '@safe-global/utils/utils/formatters'
import css from './styles.module.css'

export type TxSummaryViewProps = {
  id: string
  isQueue: boolean
  isConflictGroup?: boolean
  isBulkGroup?: boolean
  showWarning: boolean
  isImitationTransaction: boolean
  showAssessment: boolean
  showSafenetStatus: boolean
  isPending: boolean
  expiredSwap: boolean
  nonce?: number
  note?: string | null
  date: ReactNode
  confirmations?: { submitted: number; required: number }
  typeIcon: ReactNode
  typeText: ReactNode
  txInfo: ReactNode
  assessment?: ReactNode
  safenetStatus?: ReactNode
  statusLabel: ReactNode
  queueActions: ReactNode
  renderSwapStatusLabel: (status: 'expired') => ReactNode
}

export const TxSummaryView = ({
  id,
  isQueue,
  isConflictGroup,
  isBulkGroup,
  showWarning,
  isImitationTransaction,
  showAssessment,
  showSafenetStatus,
  isPending,
  expiredSwap,
  nonce,
  note,
  date,
  confirmations,
  typeIcon,
  typeText,
  txInfo,
  assessment,
  safenetStatus,
  statusLabel,
  queueActions,
  renderSwapStatusLabel,
}: TxSummaryViewProps): ReactElement => {
  return (
    <div
      data-testid="transaction-item"
      className={classNames(css.gridContainer, {
        // Top-level queue rows carry the most cells, so they get their own narrow-width template.
        [css.queue]: isQueue && !isConflictGroup && !isBulkGroup,
        [css.history]: !isQueue,
        [css.conflictGroup]: isConflictGroup,
        [css.bulkGroup]: isBulkGroup,
        [css.untrusted]: showWarning,
        [css.withAssessment]: showAssessment,
        [css.withSafenet]: showSafenetStatus,
      })}
      id={id}
    >
      {/* The warning claims the same cell, so the nonce yields to it rather than stacking underneath. */}
      {nonce !== undefined && !isConflictGroup && !showWarning && (
        <div data-testid="nonce" className={css.nonce} style={{ gridArea: 'nonce' }}>
          {nonce}
        </div>
      )}

      {showWarning && (
        <div data-testid="warning" style={{ gridArea: 'nonce' }}>
          <MaliciousTxWarning withTooltip={!isImitationTransaction} />
        </div>
      )}

      <div data-testid="tx-type" className={css.type} style={{ gridArea: 'type' }}>
        {/* Composed from TxType's icon and text rather than the combined export, so this file owns the
            label's class and can drop it on phones while keeping the icon. */}
        <div className={css.typeRow}>
          {typeIcon}
          <span className={css.typeLabel}>{typeText}</span>
        </div>

        {note && (
          <Typography
            variant="paragraph-small"
            className={classNames('text-[var(--color-text-secondary)]', css.note)}
            title={note}
          >
            {ellipsis(note, 25)}
          </Typography>
        )}
      </div>

      <div data-testid="tx-info" className={css.info} style={{ gridArea: 'info' }}>
        {txInfo}
      </div>

      <div data-testid="tx-date" className={css.date} style={{ gridArea: 'date' }}>
        {date}
      </div>

      {isQueue && confirmations && (
        <div style={{ gridArea: 'confirmations' }}>
          {confirmations.submitted > 0 || isPending ? (
            <TxConfirmations
              submittedConfirmations={confirmations.submitted}
              requiredConfirmations={confirmations.required}
            />
          ) : (
            <TxProposalChip />
          )}
        </div>
      )}

      {showAssessment && assessment && (
        <div style={{ gridArea: 'assessment' }} className={css.assessment}>
          {assessment}
        </div>
      )}

      {showSafenetStatus && safenetStatus && (
        <div style={{ gridArea: 'safenet' }} className={css.safenet}>
          {safenetStatus}
        </div>
      )}

      {!isQueue && (
        <div className={css.status} style={{ gridArea: 'status' }}>
          {statusLabel}
        </div>
      )}

      {/* A queue row's status takes the action's cell, so pending rows keep the same tracks as the rest. */}
      {isQueue && (
        <div className={css.actions} style={{ gridArea: 'actions' }}>
          {expiredSwap ? (
            renderSwapStatusLabel('expired')
          ) : (
            <>
              {isPending && statusLabel}
              {queueActions}
            </>
          )}
        </div>
      )}
    </div>
  )
}
