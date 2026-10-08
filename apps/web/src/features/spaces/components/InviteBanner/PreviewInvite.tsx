import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useCurrentSpaceId } from '@/features/spaces'
import { isAuthenticated } from '@/store/authSlice'
import { useAppSelector } from '@/store'
import AcceptButton from './AcceptButton'
import DeclineButton from './DeclineButton'
import { useDarkMode } from '@/hooks/useDarkMode'
import Inviter from './Inviter'
import { getInvitedByName } from '@/features/spaces/utils'
import { PreviewInviteView } from '@views/features/spaces/components/InviteBanner/PreviewInviteView'

const PreviewInvite = () => {
  const isDarkMode = useDarkMode()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useCurrentSpaceId()
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isUserSignedIn || !spaceId })
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const invitedByName = getInvitedByName(space, currentUser?.id)

  if (!space) return null

  return (
    <PreviewInviteView
      isDarkMode={isDarkMode}
      spaceName={space.name}
      renderInviter={(props) => <Inviter {...props} invitedByName={invitedByName} />}
      acceptButton={<AcceptButton space={space} />}
      declineButton={<DeclineButton space={space} />}
    />
  )
}

export default PreviewInvite
