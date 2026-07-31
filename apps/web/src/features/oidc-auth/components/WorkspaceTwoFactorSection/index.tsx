import { ShieldCheck } from 'lucide-react'
import NextLink from 'next/link'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useHasFeature } from '@/hooks/useChains'
import { getTwoFactorCoverage } from '../../utils/twoFactor'

/**
 * Two-factor authentication card on the workspace settings page. States the
 * always-on 2FA policy and how much of the workspace it covers, and points at
 * the Team page — to manage the members it doesn't cover, or just to see them
 * when the viewer isn't an admin.
 *
 * Gated behind the SWITCH_AUTHENTICATOR feature, like the account-level 2FA cards.
 */
const WorkspaceTwoFactorSection = ({
  members,
  spaceId,
  isAdmin,
}: {
  members: MemberDto[]
  spaceId?: string
  isAdmin?: boolean
}) => {
  const isSwitchAuthenticatorEnabled = useHasFeature(FEATURES.SWITCH_AUTHENTICATOR)

  if (!isSwitchAuthenticatorEnabled) {
    return null
  }

  const { enabled, total } = getTwoFactorCoverage(members)

  return (
    <section className="bg-card rounded-2xl p-6 mb-3" data-testid="settings-workspace-2fa">
      <div className="flex items-center gap-3 mb-2">
        <Typography variant="paragraph-bold" className="block tracking-tight">
          Two-factor authentication
        </Typography>
        <Badge variant="success">
          <ShieldCheck />
          Required for everyone
        </Badge>
      </div>

      <Typography variant="paragraph-small" color="muted" className="block max-w-[560px]">
        Everyone who signs in with email or Google needs a 6-digit code from their authenticator app. This can&apos;t be
        turned off.
      </Typography>

      <div className="border-border mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Typography variant="paragraph-small-bold" data-testid="workspace-2fa-count">
          {enabled}/{total} users have 2FA enabled
        </Typography>

        <Button
          variant="outline"
          size="sm"
          data-testid="workspace-2fa-manage-members"
          nativeButton={false}
          render={<NextLink href={{ pathname: AppRoutes.spaces.members, query: spaceId ? { spaceId } : undefined }} />}
        >
          {isAdmin ? 'Manage members' : 'See members'}
        </Button>
      </div>
    </section>
  )
}

export default WorkspaceTwoFactorSection
