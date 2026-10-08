import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getMemberTwoFactorStatus } from '../../utils/twoFactor'
import { MemberTwoFactorBadgeView } from '@views/features/oidc-auth/components/MemberTwoFactorBadge/MemberTwoFactorBadgeView'

/**
 * 2FA status of a single workspace member, as shown in the Team table.
 * Renders nothing for declined invites, which have no 2FA state.
 */
const MemberTwoFactorBadge = ({ member }: { member: MemberDto }) => {
  const status = getMemberTwoFactorStatus(member)

  if (!status) {
    return null
  }

  return <MemberTwoFactorBadgeView status={status} />
}

export default MemberTwoFactorBadge
