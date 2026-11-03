import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { OidcAuthContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components)
// ─────────────────────────────────────────────────────────────────

export const OidcAuthFeature = createFeatureHandle<OidcAuthContract>('oidc-auth')

// Direct (non-lazy) component export: the spaces account settings page is
// user-scoped, so the chain-based OIDC_AUTH flag gating of the feature
// handle does not apply there.
export { default as SwitchAuthenticatorSection } from './components/SwitchAuthenticatorSection'
export { default as WalletTwoFactorSection } from './components/WalletTwoFactorSection'
export { default as WorkspaceTwoFactorSection } from './components/WorkspaceTwoFactorSection'
export { default as MemberTwoFactorBadge } from './components/MemberTwoFactorBadge'
