/**
 * OIDC Auth Feature Contract - v3 Architecture
 *
 * Defines the public API surface for lazy-loaded components.
 * Accessed via useLoadFeature(OidcAuthFeature).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → Component (stub renders null when not ready)
 */

import type EmailSignInButton from './components/EmailSignInButton'
import type GoogleSignInButton from './components/GoogleSignInButton'

export interface OidcAuthContract {
  EmailSignInButton: typeof EmailSignInButton
  GoogleSignInButton: typeof GoogleSignInButton
}
