/**
 * OIDC Auth Feature - Public API (v3 Architecture)
 *
 * Provides OIDC login alongside SIWE.
 * Uses createFeatureHandle auto-derivation: 'oidc-auth' → FEATURES.OIDC_AUTH
 */
import { createFeatureHandle } from '@/features/__core__'
import type { OidcAuthContract } from './contract'

export const OidcAuthFeature = createFeatureHandle<OidcAuthContract>('oidc-auth')

export type { OidcAuthContract } from './contract'

export { useOidcLogin } from './hooks/useOidcLogin'
export { useOidcLoginCallback } from './hooks/useOidcLoginCallback'
export { useAuthenticators } from './hooks/useAuthenticators'
export { useStepUpCallback } from './hooks/useStepUpCallback'

// Direct (non-lazy) component export: the spaces account settings page is
// user-scoped, so the chain-based OIDC_AUTH flag gating of the feature
// handle does not apply there.
export { default as SwitchAuthenticatorSection } from './components/SwitchAuthenticatorSection'
export { default as WalletTwoFactorSection } from './components/WalletTwoFactorSection'
export { default as WorkspaceTwoFactorSection } from './components/WorkspaceTwoFactorSection'
export { default as MemberTwoFactorBadge } from './components/MemberTwoFactorBadge'

export { ELEVATION_REQUIRED_ERROR, ELEVATION_REQUIRED_MESSAGE, isElevationRequiredError } from './utils/elevation'
export { startStepUp } from './utils/stepUp'
export { useStepUpSplash } from './hooks/useStepUpSplash'

export { getMemberTwoFactorStatus, getTwoFactorCoverage, MemberTwoFactorStatus } from './utils/twoFactor'
