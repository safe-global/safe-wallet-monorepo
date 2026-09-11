import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useCurrentSpaceId } from '@/features/spaces'
import { isAuthenticated } from '@/store/authSlice'
import { useAppSelector } from '@/store'
import AcceptButton from './AcceptButton'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import DeclineButton from './DeclineButton'
import { useDarkMode } from '@/hooks/useDarkMode'
import Inviter from './Inviter'
import { getInvitedByName } from '@/features/spaces/utils'

const PreviewInvite = () => {
  const isDarkMode = useDarkMode()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useCurrentSpaceId()
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isUserSignedIn || !spaceId })
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const invitedByName = getInvitedByName(space, currentUser?.id)

  if (!space) return null

  return (
    <div
      className={cn(
        'mb-8 rounded-xl p-4',
        isDarkMode ? 'bg-[var(--color-info-background)]' : 'bg-[var(--color-info-light)]',
      )}
    >
      <div className="flex flex-row gap-4 max-[600px]:flex-col max-[600px]:gap-2">
        <InitialsAvatar name={space.name} size="medium" />
        <div className="flex flex-grow flex-row flex-wrap items-center gap-x-1 gap-y-1">
          <Typography variant="paragraph">You were invited to join</Typography>
          <Typography variant="paragraph-bold">{space.name}</Typography>
          <Inviter invitedByName={invitedByName} variant="paragraph" avatarSize={20} />
        </div>
        <div className="flex flex-row gap-2">
          <Track {...SPACE_EVENTS.ACCEPT_INVITE} label={SPACE_LABELS.preview_banner}>
            <AcceptButton space={space} />
          </Track>
          <Track {...SPACE_EVENTS.DECLINE_INVITE} label={SPACE_LABELS.preview_banner}>
            <DeclineButton space={space} />
          </Track>
        </div>
      </div>
    </div>
  )
}

export default PreviewInvite
