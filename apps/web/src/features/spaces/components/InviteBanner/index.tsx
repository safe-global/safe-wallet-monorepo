import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import AcceptButton from './AcceptButton'
import DeclineButton from './DeclineButton'
import Inviter from './Inviter'
import { InviteBannerView } from '@views/features/spaces/components/InviteBanner/InviteBannerView'

type SpaceListInvite = {
  space: GetSpaceResponse
  invitedByName: string | undefined
}

const SpaceListInvite = ({ space, invitedByName }: SpaceListInvite) => {
  const { name, safeCount, memberCount } = space

  return (
    <InviteBannerView
      name={name}
      safeCount={safeCount}
      memberCount={memberCount}
      renderInviter={(props) => <Inviter {...props} invitedByName={invitedByName} />}
      acceptButton={<AcceptButton space={space} />}
      declineButton={<DeclineButton space={space} />}
    />
  )
}

export default SpaceListInvite
