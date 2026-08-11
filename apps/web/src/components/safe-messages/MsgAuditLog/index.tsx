import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { type ReactElement } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Copy as CopyIcon } from 'lucide-react'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import { AuditRow, AuditLogHeader } from '@/components/common/AuditLog'
import CopyTooltip from '@/components/common/CopyTooltip'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import useOrigin from '@/hooks/useOrigin'
import useAddressBook from '@/hooks/useAddressBook'

const MsgAuditLog = ({ msg }: { msg: MessageItem }): ReactElement => {
  const addressBook = useAddressBook()
  const router = useRouter()
  const { safe = '' } = router.query
  const origin = useOrigin()
  const msgUrl = `${origin}${AppRoutes.transactions.msg}?safe=${safe}&messageHash=${msg.messageHash}`
  const { confirmations, confirmationsRequired, confirmationsSubmitted, proposedBy, creationTimestamp } = msg
  const isConfirmed = msg.status === 'CONFIRMED'

  const resolveName = (address: string | undefined, apiFallback?: string | null): string | undefined =>
    address ? addressBook[address] || apiFallback || undefined : undefined

  const signingLabel = (idx: number) => `Signed (${idx + 1}/${confirmationsRequired})`

  return (
    <div className="mb-4" data-testid="msg-audit-log">
      <AuditLogHeader
        chip={
          <TxConfirmations
            submittedConfirmations={confirmationsSubmitted}
            requiredConfirmations={confirmationsRequired}
          />
        }
        actions={
          <CopyTooltip text={msgUrl} initialToolTipText="Copy message link">
            <Button variant="ghost" size="icon-sm" className="text-inherit">
              <CopyIcon className="size-5" />
            </Button>
          </CopyTooltip>
        }
      />

      <AuditRow
        label="Created"
        actionType="created"
        address={proposedBy.value}
        name={resolveName(proposedBy.value, proposedBy.name)}
        timestamp={creationTimestamp}
        isLast={confirmations.length === 0 && !isConfirmed}
      />

      {confirmations.map(({ owner }, idx) => (
        <AuditRow
          key={owner.value}
          label={signingLabel(idx)}
          actionType="signed"
          address={owner.value}
          name={resolveName(owner.value, owner.name)}
          isLast={idx === confirmations.length - 1 && !isConfirmed}
        />
      ))}

      {isConfirmed && <AuditRow label="Confirmed" actionType="confirmed" timestamp={msg.modifiedTimestamp} isLast />}

      {!isConfirmed && <Alert className="mt-4 py-1">Can be confirmed once the threshold is reached.</Alert>}
    </div>
  )
}

export default MsgAuditLog
