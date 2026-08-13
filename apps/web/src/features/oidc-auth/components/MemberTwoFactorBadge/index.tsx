import { Wallet, type LucideIcon } from 'lucide-react'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { getMemberTwoFactorStatus, MemberTwoFactorStatus } from '../../utils/twoFactor'

const BADGE_BY_STATUS: Record<
  MemberTwoFactorStatus,
  { label: string; variant: 'success' | 'secondary'; icon?: LucideIcon; dot?: boolean }
> = {
  [MemberTwoFactorStatus.ACTIVE]: { label: 'Active', variant: 'success', dot: true },
  [MemberTwoFactorStatus.WALLET_SIGN_IN]: { label: 'Wallet sign-in', variant: 'secondary', icon: Wallet },
  [MemberTwoFactorStatus.INVITE_PENDING]: { label: 'Invite pending', variant: 'secondary' },
}

/**
 * 2FA status of a single workspace member, as shown in the Team table.
 * Renders nothing for declined invites, which have no 2FA state.
 */
const MemberTwoFactorBadge = ({ member }: { member: MemberDto }) => {
  const status = getMemberTwoFactorStatus(member)

  if (!status) {
    return null
  }

  const { label, variant, icon: Icon, dot } = BADGE_BY_STATUS[status]

  return (
    <Badge variant={variant} size="sm" data-testid="member-2fa-badge">
      {dot && <BadgeDot />}
      {Icon && <Icon />}
      {label}
    </Badge>
  )
}

export default MemberTwoFactorBadge
