import type { SafeMessageStatus } from '@safe-global/store/gateway/types'
import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { Spinner } from '@/components/ui/spinner'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import css from '@/components/transactions/TxSummary/styles.module.css'

const getStatusColor = (value: SafeMessageStatus): string => {
  switch (value) {
    case 'CONFIRMED':
      return 'var(--color-success-main)'
    case 'NEEDS_CONFIRMATION':
      return 'var(--color-warning-main)'
    default:
      return 'var(--color-text-primary)'
  }
}

export type MsgSummaryViewProps = {
  type: string
  status: SafeMessageStatus
  statusLabel: ReactNode
  confirmationsSubmitted: number
  confirmationsRequired: number
  isConfirmed: boolean
  isPending: boolean
  msgType: ReactNode
  dateTime: ReactNode
  signButton: ReactNode
}

export function MsgSummaryView({
  type,
  status,
  statusLabel,
  confirmationsSubmitted,
  confirmationsRequired,
  isConfirmed,
  isPending,
  msgType,
  dateTime,
  signButton,
}: MsgSummaryViewProps): ReactElement {
  return (
    <div className={[css.gridContainer, css.message].join(' ')}>
      <div style={{ gridArea: 'type' }}>{msgType}</div>

      <div style={{ gridArea: 'info' }}>{type || 'Signature'}</div>

      <div style={{ gridArea: 'date' }} className={css.date}>
        {dateTime}
      </div>

      <div style={{ gridArea: 'confirmations' }}>
        {confirmationsRequired > 0 && (
          <TxConfirmations
            submittedConfirmations={confirmationsSubmitted}
            requiredConfirmations={confirmationsRequired}
          />
        )}
      </div>

      <div style={{ gridArea: 'status' }}>
        {isConfirmed || isPending ? (
          <Typography
            variant="paragraph-mini-bold"
            className="flex items-center gap-2"
            style={{ color: getStatusColor(status) }}
          >
            {isPending && <Spinner className="size-3.5" />}

            {statusLabel}
          </Typography>
        ) : (
          signButton
        )}
      </div>
    </div>
  )
}
