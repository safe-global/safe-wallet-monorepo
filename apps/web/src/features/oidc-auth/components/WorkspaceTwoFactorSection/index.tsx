import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { getTwoFactorCoverage } from '../../utils/twoFactor'
import { WorkspaceTwoFactorSectionView } from '@views/features/oidc-auth/components/WorkspaceTwoFactorSection/WorkspaceTwoFactorSectionView'

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

  const { enabled, total, walletOnly } = getTwoFactorCoverage(members)

  return (
    <WorkspaceTwoFactorSectionView
      enabled={enabled}
      total={total}
      walletOnly={walletOnly}
      spaceId={spaceId}
      isAdmin={isAdmin}
    />
  )
}

export default WorkspaceTwoFactorSection
