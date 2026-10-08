import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import useRenewInvite from './useRenewInvite'
import { RenewInviteButtonView } from '@views/features/spaces/components/MembersList/RenewInviteButtonView'

const RenewInviteButton = ({ member }: { member: MemberDto }) => {
  const { renewInvite: handleRenew, isLoading } = useRenewInvite(member)

  return (
    <RenewInviteButtonView
      onRenew={handleRenew}
      isLoading={isLoading}
      hasEmail={Boolean(member.user.email)}
      mixpanelParams={{ [MixpanelEventParams.MEMBER_ROLE]: member.role }}
    />
  )
}

export default RenewInviteButton
