import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { WalletTwoFactorSectionView } from '@views/features/oidc-auth/components/WalletTwoFactorSection/WalletTwoFactorSectionView'

/**
 * Two-factor authentication section shown to wallet (SIWE) users on the
 * account settings page. 2FA protects email and Google sign-ins but not
 * wallet sign-ins; this card explains that state and points users who want
 * 2FA to an email or Google account.
 *
 * Gated behind the SWITCH_AUTHENTICATOR feature so it only appears once the
 * authenticator/2FA feature is enabled. Renders nothing for OIDC
 * (email/Google) sessions — the switch-authenticator flow covers those.
 */
const WalletTwoFactorSection = () => {
  const isSwitchAuthenticatorEnabled = useHasFeature(FEATURES.SWITCH_AUTHENTICATOR)
  const { data: session } = useAuthGetMeV1Query()

  if (!isSwitchAuthenticatorEnabled || session?.authMethod !== 'siwe') {
    return null
  }

  return <WalletTwoFactorSectionView />
}

export default WalletTwoFactorSection
