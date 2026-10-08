import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'

import {
  AuditLogView as AuditLog,
  AuditLogHeaderView as AuditLogHeader,
  formatAuditDateTime,
  type AuditRowViewProps,
} from '@views/components/common/AuditLog/AuditLogView'
import { Countdown } from '@/components/common/Countdown'

import txDetailsCss from '@/components/transactions/TxDetails/styles.module.css'

export type AuditRowSlotProps = Omit<AuditRowViewProps, 'copied' | 'onCopy'>

export type RecoverySignersViewProps = {
  isExecutable: boolean
  isExpired: boolean
  isNext: boolean
  remainingSeconds: number
  executor: string
  executorName?: string
  timestamp: bigint
  expiresAt: bigint | null
  renderAuditRow: (props: AuditRowSlotProps) => ReactNode
  executeButton: ReactNode
  cancelButton: ReactNode
}

export function RecoverySignersView({
  isExecutable,
  isExpired,
  isNext,
  remainingSeconds,
  executor,
  executorName,
  timestamp,
  expiresAt,
  renderAuditRow,
  executeButton,
  cancelButton,
}: RecoverySignersViewProps): ReactElement {
  const executionLabel = isExpired ? 'Expired' : isExecutable ? 'Executable' : 'Waiting'
  const executionActionType = isExpired ? 'expired' : isExecutable ? 'executed' : 'pending'

  const expiresAtFormatted = expiresAt !== null ? formatAuditDateTime(Number(expiresAt)) : null

  const desc = isExecutable
    ? expiresAtFormatted
      ? `The recovery proposal can be executed until ${expiresAtFormatted}.`
      : 'The recovery proposal can be executed now.'
    : isExpired
      ? 'The recovery proposal has expired and needs to be cancelled before a new one can be created.'
      : 'The recovery proposal can be executed after the review window has passed.'

  return (
    <>
      <AuditLog>
        <AuditLogHeader />

        {renderAuditRow({
          label: 'Created',
          actionType: 'created',
          address: executor,
          name: executorName,
          timestamp: Number(timestamp),
        })}

        {renderAuditRow({ label: executionLabel, actionType: executionActionType, isLast: true })}

        <Alert variant={isExpired ? 'warning' : 'info'} outlined={false} className="mt-4">
          <AlertSeverityIcon variant={isExpired ? 'warning' : 'info'} />
          <AlertDescription>{desc}</AlertDescription>
        </Alert>

        {isNext && remainingSeconds > 0 && (
          <div className="mt-4">
            <Countdown seconds={remainingSeconds} />
          </div>
        )}
      </AuditLog>

      <div className={txDetailsCss.buttons}>
        {executeButton}
        {cancelButton}
      </div>
    </>
  )
}
