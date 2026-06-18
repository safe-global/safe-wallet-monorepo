import { isAddress } from 'ethers'
import Identicon from '@/components/common/Identicon'
import EthHashInfo from '@/components/common/EthHashInfo'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { formatDate } from '@/features/spaces/utils'
import type { SpaceAuditLogEntryDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useMemberNameResolver } from '../../hooks/useMemberNameResolver'
import { getAuditEventDescription, getDefaultTargetDisplay, getTargetUserId } from './auditEventCopy'

// People resolve as: space member name → wallet address → server label.
// Shared address-book names are member-editable and are deliberately not
// used here.
function ActorAvatar({ actor, memberName }: { actor: string; memberName?: string }) {
  if (memberName) {
    return <InitialsAvatar name={memberName} size="medium" rounded />
  }
  return isAddress(actor) ? (
    <Identicon address={actor} size={32} />
  ) : (
    <InitialsAvatar name={actor} size="medium" rounded />
  )
}

function ActorName({ actor, memberName }: { actor: string; memberName?: string }) {
  if (memberName) {
    return <span className="min-w-0 font-bold break-all">{memberName}</span>
  }

  if (!isAddress(actor)) {
    return <span className="min-w-0 font-bold break-all">{actor}</span>
  }

  return (
    <span className="inline-flex font-bold [&>div]:inline-flex [&>div]:items-center">
      <EthHashInfo
        address={actor}
        shortAddress={false}
        showAvatar={false}
        showName={false}
        showPrefix={false}
        showCopyButton
      />
    </span>
  )
}

function AuditEventRow({ event }: { event: SpaceAuditLogEntryDto }) {
  const resolveMemberName = useMemberNameResolver()
  const actorMemberName = resolveMemberName(event.actorUserId)
  const targetDisplay = resolveMemberName(getTargetUserId(event.payload)) ?? getDefaultTargetDisplay(event)

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="shrink-0 pt-0.5">
        <ActorAvatar actor={event.actor} memberName={actorMemberName} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1 text-sm">
          <ActorName actor={event.actor} memberName={actorMemberName} />
          <span>{getAuditEventDescription(event, targetDisplay)}</span>
        </div>

        <p className="text-muted-foreground mt-0.5 text-xs">{formatDate(event.createdAt)}</p>
      </div>
    </div>
  )
}

export default AuditEventRow
