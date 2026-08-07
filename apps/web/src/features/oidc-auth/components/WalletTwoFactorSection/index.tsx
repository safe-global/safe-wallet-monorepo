import { Shield } from 'lucide-react'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { useHasFeature } from '@/hooks/useChains'

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

  return (
    <section className="bg-card rounded-2xl p-6 mb-3" data-testid="settings-wallet-2fa">
      <div className="flex items-center gap-3 mb-2">
        <Typography variant="paragraph-bold" className="block tracking-tight">
          Two-factor authentication
        </Typography>
        <Badge variant="warning">
          <Shield />
          Not active for wallet sign-in
        </Badge>
      </div>

      <Typography variant="paragraph-small" color="muted" className="block max-w-[560px]">
        You&apos;re signed in with your wallet — your signature is your key. 2FA currently protects email and Google
        sign-ins. If you want 2FA today, create a new email or Google account instead.
      </Typography>
    </section>
  )
}

export default WalletTwoFactorSection
