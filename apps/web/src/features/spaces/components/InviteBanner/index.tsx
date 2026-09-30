import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SpaceSummary } from '../SpaceCard'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import css from './styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import AcceptButton from './AcceptButton'
import DeclineButton from './DeclineButton'
import Inviter from './Inviter'

type SpaceListInvite = {
  space: GetSpaceResponse
  invitedByName: string | undefined
}

const SpaceListInvite = ({ space, invitedByName }: SpaceListInvite) => {
  const { name, safeCount, memberCount } = space

  return (
    <div className="mb-4 rounded-3xl bg-card p-4" data-testid="space-invite-banner">
      <div className={cn(css.spacesListInviteContent, 'mb-4')}>
        <div className="flex flex-grow flex-row flex-wrap items-center gap-x-1 gap-y-1">
          <Typography variant="paragraph-small">You were invited to join</Typography>
          <Typography variant="paragraph-small-bold">{name}</Typography>
          <Inviter invitedByName={invitedByName} variant="paragraph-small" avatarSize={24} />
        </div>

        <div className={cn(css.inviteButtonContainer, 'flex flex-row gap-2')}>
          <Track {...SPACE_EVENTS.DECLINE_INVITE} label={SPACE_LABELS.space_list_page}>
            <DeclineButton space={space} />
          </Track>
          <Track {...SPACE_EVENTS.ACCEPT_INVITE} label={SPACE_LABELS.space_list_page}>
            <AcceptButton space={space} />
          </Track>
        </div>
      </div>

      <div className="flex flex-row items-center gap-3 rounded-2xl bg-[var(--color-background-main)] px-2 py-3">
        <InitialsAvatar name={name} size="medium" />
        <SpaceSummary name={name} numberOfAccounts={safeCount} numberOfMembers={memberCount} isCompact />
      </div>
    </div>
  )
}

export default SpaceListInvite
