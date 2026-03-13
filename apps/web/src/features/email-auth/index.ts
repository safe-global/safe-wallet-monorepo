/**
 * Email Auth Feature - Public API (v3 Architecture)
 *
 * Provides Auth0-based email login alongside SIWE.
 * Uses createFeatureHandle auto-derivation: 'email-auth' → FEATURES.EMAIL_AUTH
 *
 * @example
 * ```typescript
 * // Component access via feature handle
 * import { EmailAuthFeature } from '@/features/email-auth'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const { EmailSignInButton } = useLoadFeature(EmailAuthFeature)
 *   return <EmailSignInButton />
 * }
 *
 * // Hook access via direct import
 * import { useAuth0Login } from '@/features/email-auth'
 * ```
 */
import { createFeatureHandle } from '@/features/__core__'
import type { EmailAuthContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components)
// ─────────────────────────────────────────────────────────────────

export const EmailAuthFeature = createFeatureHandle<EmailAuthContract>('email-auth')

// Contract type
export type { EmailAuthContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// PUBLIC HOOKS (always loaded, not lazy)
// ─────────────────────────────────────────────────────────────────

export { useAuth0Login } from './hooks/useAuth0Login'

// ─────────────────────────────────────────────────────────────────
// PROVIDER (imported directly in _app.tsx, not lazy-loaded)
// ─────────────────────────────────────────────────────────────────

export { Auth0ProviderWrapper } from './components/Auth0ProviderWrapper'
