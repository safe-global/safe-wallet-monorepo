import { Wallet, type LucideIcon } from 'lucide-react'
import { Badge, BadgeDot } from '@/components/ui/badge'
import type { MemberTwoFactorStatus } from '@/features/oidc-auth/utils/twoFactor'

const BADGE_BY_STATUS: Record<
  `${MemberTwoFactorStatus}`,
  { label: string; variant: 'success' | 'secondary'; icon?: LucideIcon; dot?: boolean }
> = {
  ACTIVE: { label: 'Active', variant: 'success', dot: true },
  WALLET_SIGN_IN: { label: 'Wallet sign-in', variant: 'secondary', icon: Wallet },
  INVITE_PENDING: { label: 'Invite pending', variant: 'secondary' },
}

export type MemberTwoFactorBadgeViewProps = {
  status: `${MemberTwoFactorStatus}`
}

export const MemberTwoFactorBadgeView = ({ status }: MemberTwoFactorBadgeViewProps) => {
  const { label, variant, icon: Icon, dot } = BADGE_BY_STATUS[status]

  return (
    <Badge variant={variant} size="status" shape="status" data-testid="member-2fa-badge">
      {dot && <BadgeDot />}
      {Icon && <Icon />}
      {label}
    </Badge>
  )
}
