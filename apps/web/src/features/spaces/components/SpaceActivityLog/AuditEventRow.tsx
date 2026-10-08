import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import { formatDate } from '@/features/spaces/utils'
import type { SpaceAuditLogEntryDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useMemberNameResolver } from '../../hooks/useMemberNameResolver'
import {
  getDefaultTargetDisplay,
  getTargetUserId,
} from '@views/features/spaces/components/SpaceActivityLog/auditEventCopy'
import { AuditEventRowView } from '@views/features/spaces/components/SpaceActivityLog/AuditEventRowView'

function AuditEventRow({ event }: { event: SpaceAuditLogEntryDto }) {
  const resolveMemberName = useMemberNameResolver()
  const actorMemberName = resolveMemberName(event.actorUserId)
  const targetDisplay = resolveMemberName(getTargetUserId(event.payload)) ?? getDefaultTargetDisplay(event)

  return (
    <AuditEventRowView
      event={event}
      actorMemberName={actorMemberName}
      isActorAddress={isAddress(event.actor)}
      actorHashInfo={
        <EthHashInfo
          address={event.actor}
          shortAddress={false}
          showAvatar={false}
          showName={false}
          showPrefix={false}
          showCopyButton
        />
      }
      targetDisplay={targetDisplay}
      createdAtLabel={formatDate(event.createdAt)}
    />
  )
}

export default AuditEventRow
