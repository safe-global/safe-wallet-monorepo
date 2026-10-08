import { Fragment, type ReactElement, type ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Copy as CopyIcon } from 'lucide-react'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import {
  AuditLogView as AuditLog,
  AuditLogHeaderView as AuditLogHeader,
} from '@views/components/common/AuditLog/AuditLogView'
import type { AuditRowProps } from '@/components/common/AuditLog'

type Signer = { address: string; name?: string }

export type MsgAuditLogViewProps = {
  confirmationsSubmitted: number
  confirmationsRequired: number
  isConfirmed: boolean
  proposer?: Signer
  creationTimestamp: number
  modifiedTimestamp: number
  confirmations: Signer[]
  renderCopyTooltip: (props: { initialToolTipText: string; children: ReactNode }) => ReactNode
  renderAuditRow: (props: AuditRowProps) => ReactNode
}

export function MsgAuditLogView({
  confirmationsSubmitted,
  confirmationsRequired,
  isConfirmed,
  proposer,
  creationTimestamp,
  modifiedTimestamp,
  confirmations,
  renderCopyTooltip,
  renderAuditRow,
}: MsgAuditLogViewProps): ReactElement {
  const signingLabel = (idx: number) => `Signed (${idx + 1}/${confirmationsRequired})`

  return (
    <AuditLog className="mb-4" data-testid="msg-audit-log">
      <AuditLogHeader
        chip={
          <TxConfirmations
            submittedConfirmations={confirmationsSubmitted}
            requiredConfirmations={confirmationsRequired}
          />
        }
        actions={renderCopyTooltip({
          initialToolTipText: 'Copy message link',
          children: (
            <Button variant="ghost" size="icon-xs" className="text-inherit">
              <CopyIcon className="size-4" />
            </Button>
          ),
        })}
      />

      {proposer &&
        renderAuditRow({
          label: 'Created',
          actionType: 'created',
          address: proposer.address,
          name: proposer.name,
          timestamp: creationTimestamp,
          isLast: confirmations.length === 0 && !isConfirmed,
        })}

      {confirmations.map(({ address, name }, idx) => (
        <Fragment key={address}>
          {renderAuditRow({
            label: signingLabel(idx),
            actionType: 'signed',
            address,
            name,
            isLast: idx === confirmations.length - 1 && !isConfirmed,
          })}
        </Fragment>
      ))}

      {isConfirmed &&
        renderAuditRow({ label: 'Confirmed', actionType: 'confirmed', timestamp: modifiedTimestamp, isLast: true })}

      {!isConfirmed && (
        <Alert variant="info" className="mt-4">
          <AlertSeverityIcon variant="info" />
          <AlertDescription>Can be confirmed once the threshold is reached.</AlertDescription>
        </Alert>
      )}
    </AuditLog>
  )
}
