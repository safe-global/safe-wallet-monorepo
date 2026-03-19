/**
 * Email Auth Feature - Public API (v3 Architecture)
 *
 * Provides email login alongside SIWE.
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
 * import { useEmailLogin } from '@/features/email-auth'
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

export { useEmailLogin } from './hooks/useEmailLogin'
export { useEmailLoginCallback } from './hooks/useEmailLoginCallback'

// ─────────────────────────────────────────────────────────────────
// PUBLIC UTILITIES
// ─────────────────────────────────────────────────────────────────

export { isEmailLoginPending } from './utils'
