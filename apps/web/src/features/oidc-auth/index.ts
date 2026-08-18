/**
 * OIDC Auth Feature - Public API (v3 Architecture)
 *
 * Provides OIDC login alongside SIWE.
 * Uses createFeatureHandle auto-derivation: 'oidc-auth' → FEATURES.OIDC_AUTH
 *
 * @example
 * ```typescript
 * // Component access via feature handle
 * import { OidcAuthFeature } from '@/features/oidc-auth'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const { EmailSignInButton } = useLoadFeature(OidcAuthFeature)
 *   return <EmailSignInButton />
 * }
 *
 * // Hook access via direct import
 * import { useOidcLogin } from '@/features/oidc-auth'
 * ```
 */
import { createFeatureHandle } from '@/features/__core__'
import type { OidcAuthContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components)
// ─────────────────────────────────────────────────────────────────

export const OidcAuthFeature = createFeatureHandle<OidcAuthContract>('oidc-auth')

// Contract type
export type { OidcAuthContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// PUBLIC HOOKS (always loaded, not lazy)
// ─────────────────────────────────────────────────────────────────

export { useOidcLogin } from './hooks/useOidcLogin'
export { useOidcLoginCallback } from './hooks/useOidcLoginCallback'
export { useAuthenticators } from './hooks/useAuthenticators'
export { useStepUp } from './hooks/useStepUp'
export { useStepUpCallback } from './hooks/useStepUpCallback'

// Direct (non-lazy) component export: the spaces account settings page is
// user-scoped, so the chain-based OIDC_AUTH flag gating of the feature
// handle does not apply there.
export { default as SwitchAuthenticatorSection } from './components/SwitchAuthenticatorSection'
export { default as WalletTwoFactorSection } from './components/WalletTwoFactorSection'
export { default as WorkspaceTwoFactorSection } from './components/WorkspaceTwoFactorSection'
export { default as MemberTwoFactorBadge } from './components/MemberTwoFactorBadge'

// Mounted at app root, and driven purely by a `403 elevation_required` from
// CGW. Deliberately not behind the chain-based OIDC_AUTH feature handle: this
// is a session-scoped prompt, and Workspace pages have no current chain, so
// gating it would leave an enforcing gateway with no way to recover.
export { default as ElevationRequiredDialog } from './components/ElevationRequiredDialog'

// ─────────────────────────────────────────────────────────────────
// STEP-UP AUTHENTICATION (elevation)
// ─────────────────────────────────────────────────────────────────

export { ELEVATION_REQUIRED_ERROR, ELEVATION_REQUIRED_MESSAGE, isElevationRequiredError } from './utils/elevation'

// ─────────────────────────────────────────────────────────────────
// 2FA STATUS DERIVATION (shared with the spaces Team page)
// ─────────────────────────────────────────────────────────────────

export { getMemberTwoFactorStatus, getTwoFactorCoverage, MemberTwoFactorStatus } from './utils/twoFactor'
