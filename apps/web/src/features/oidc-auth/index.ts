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
