import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useAuthenticators } from '../../hooks/useAuthenticators'
import { SwitchAuthenticatorSectionView } from '@views/features/oidc-auth/components/SwitchAuthenticatorSection/SwitchAuthenticatorSectionView'

/**
 * Two-factor authentication section for the spaces account settings page.
 * Renders nothing for non-OIDC sessions.
 *
 * One authenticator slot: a skeleton while loading, then either the
 * enrolled authenticator (with a "Change" action) or an "Add authenticator"
 * button. Both route through the provider's hosted pages: verify with the
 * current factor, scan the new QR code there, and return.
 */
const SwitchAuthenticatorSection = () => {
  const isSwitchAuthenticatorEnabled = useHasFeature(FEATURES.SWITCH_AUTHENTICATOR)
  const { isOidcSession, authenticators, error, enrollNewAuthenticator } = useAuthenticators()

  if (!isSwitchAuthenticatorEnabled || !isOidcSession) {
    return null
  }

  const isLoading = authenticators === undefined && !error
  const authenticator = authenticators?.[0]

  return (
    <SwitchAuthenticatorSectionView
      isLoading={isLoading}
      authenticator={authenticator}
      error={error}
      onEnroll={enrollNewAuthenticator}
    />
  )
}

export default SwitchAuthenticatorSection
