import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { type ReactElement } from 'react'
import { AuditRow } from '@/components/common/AuditLog'
import CopyTooltip from '@/components/common/CopyTooltip'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import useOrigin from '@/hooks/useOrigin'
import useAddressBook from '@/hooks/useAddressBook'
import { withSpaceIdInUrl, useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { MsgAuditLogView } from '@views/components/safe-messages/MsgAuditLog/MsgAuditLogView'

const MsgAuditLog = ({ msg }: { msg: MessageItem }): ReactElement => {
  const addressBook = useAddressBook()
  const router = useRouter()
  const { safe = '' } = router.query
  const spaceId = useUrlSpaceId()
  const origin = useOrigin()
  const msgUrl = withSpaceIdInUrl(
    `${origin}${AppRoutes.transactions.msg}?safe=${safe}&messageHash=${msg.messageHash}`,
    spaceId,
  )
  const { confirmations, confirmationsRequired, confirmationsSubmitted, proposedBy, creationTimestamp } = msg
  const isConfirmed = msg.status === 'CONFIRMED'

  const resolveName = (address: string | undefined, apiFallback?: string | null): string | undefined =>
    address ? addressBook[address] || apiFallback || undefined : undefined

  return (
    <MsgAuditLogView
      confirmationsSubmitted={confirmationsSubmitted}
      confirmationsRequired={confirmationsRequired}
      isConfirmed={isConfirmed}
      proposer={
        proposedBy ? { address: proposedBy.value, name: resolveName(proposedBy.value, proposedBy.name) } : undefined
      }
      creationTimestamp={creationTimestamp}
      modifiedTimestamp={msg.modifiedTimestamp}
      confirmations={confirmations.map(({ owner }) => ({
        address: owner.value,
        name: resolveName(owner.value, owner.name),
      }))}
      renderCopyTooltip={(props) => <CopyTooltip text={msgUrl} {...props} />}
      renderAuditRow={(props) => <AuditRow {...props} />}
    />
  )
}

export default MsgAuditLog
