/**
 * Email Auth Feature Contract - v3 Architecture
 *
 * Defines the public API surface for lazy-loaded components.
 * Accessed via useLoadFeature(EmailAuthFeature).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → Component (stub renders null when not ready)
 */

import type EmailSignInButton from './components/EmailSignInButton'

export interface EmailAuthContract {
  EmailSignInButton: typeof EmailSignInButton
}
