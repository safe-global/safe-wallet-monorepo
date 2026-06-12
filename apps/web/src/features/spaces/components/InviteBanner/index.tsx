import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SpaceSummary } from '../SpaceCard'
import { MemberStatus } from '@/features/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import AcceptButton from './AcceptButton'
import DeclineButton from './DeclineButton'
import { trackEvent } from '@/services/analytics'
import Inviter from './Inviter'

type SpaceListInvite = {
  space: GetSpaceResponse
  invitedByName: string | undefined
}

const SpaceListInvite = ({ space, invitedByName }: SpaceListInvite) => {
  const { id, name, members, safeCount } = space
  const numberOfMembers = members.filter((member) => member.status === MemberStatus.ACTIVE).length

  return (
    <div className="mb-4 rounded-xl bg-card p-4" data-testid="space-invite-banner">
      <div className="mb-4 flex flex-row flex-wrap items-center gap-x-1 gap-y-1">
        <Typography variant="h4" className="text-muted-foreground">
          You were invited to join
        </Typography>
        <Typography variant="h4" className="text-foreground">
          {name}
        </Typography>
        <Inviter invitedByName={invitedByName} variant="h4" avatarSize={24} />
      </div>

      <Link
        variant="inherit"
        className="block no-underline hover:no-underline"
        render={<NextLink href={{ pathname: AppRoutes.spaces.index, query: { spaceId: id } }} />}
        onClick={() => trackEvent({ ...SPACE_EVENTS.VIEW_INVITING_SPACE })}
      >
        <div className="rounded-xl bg-[var(--color-background-main)] p-4 transition-colors hover:bg-[var(--color-background-light)]">
          <div className={css.spacesListInviteContent}>
            <div className="flex flex-grow flex-row items-center gap-4">
              <div>
                <InitialsAvatar name={name} size="large" />
              </div>

              <div>
                <SpaceSummary name={name} numberOfAccounts={safeCount} numberOfMembers={numberOfMembers} />
              </div>
            </div>

            <div className="flex flex-row gap-2">
              <Track {...SPACE_EVENTS.ACCEPT_INVITE} label={SPACE_LABELS.space_list_page}>
                <AcceptButton space={space} />
              </Track>
              <Track {...SPACE_EVENTS.DECLINE_INVITE} label={SPACE_LABELS.space_list_page}>
                <DeclineButton space={space} />
              </Track>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default SpaceListInvite
