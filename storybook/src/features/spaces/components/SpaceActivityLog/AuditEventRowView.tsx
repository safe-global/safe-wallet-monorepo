import type { ReactNode } from 'react'
import Identicon from '@/components/common/Identicon'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import type { SpaceAuditLogEntryDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getAuditEventDescription } from './auditEventCopy'

export type AuditEventRowViewProps = {
  event: SpaceAuditLogEntryDto
  actorMemberName?: string
  isActorAddress: boolean
  actorHashInfo: ReactNode
  targetDisplay: string
  createdAtLabel: string
}

// People resolve as: space member name → wallet address → server label.
// Shared address-book names are member-editable and are deliberately not
// used here.
function ActorAvatar({
  actor,
  memberName,
  isActorAddress,
}: {
  actor: string
  memberName?: string
  isActorAddress: boolean
}) {
  if (memberName) {
    return <InitialsAvatar name={memberName} size="medium" rounded />
  }
  return isActorAddress ? (
    <Identicon address={actor} size={32} />
  ) : (
    <InitialsAvatar name={actor} size="medium" rounded />
  )
}

function ActorName({
  actor,
  memberName,
  isActorAddress,
  actorHashInfo,
}: {
  actor: string
  memberName?: string
  isActorAddress: boolean
  actorHashInfo: ReactNode
}) {
  if (memberName) {
    return <span className="min-w-0 font-bold break-all">{memberName}</span>
  }

  if (!isActorAddress) {
    return <span className="min-w-0 font-bold break-all">{actor}</span>
  }

  return <span className="inline-flex font-bold [&>div]:inline-flex [&>div]:items-center">{actorHashInfo}</span>
}

export function AuditEventRowView({
  event,
  actorMemberName,
  isActorAddress,
  actorHashInfo,
  targetDisplay,
  createdAtLabel,
}: AuditEventRowViewProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="shrink-0 pt-0.5">
        <ActorAvatar actor={event.actor} memberName={actorMemberName} isActorAddress={isActorAddress} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1 text-sm">
          <ActorName
            actor={event.actor}
            memberName={actorMemberName}
            isActorAddress={isActorAddress}
            actorHashInfo={actorHashInfo}
          />
          <span>{getAuditEventDescription(event, targetDisplay)}</span>
        </div>

        <p className="text-muted-foreground mt-0.5 text-xs">{createdAtLabel}</p>
      </div>
    </div>
  )
}
