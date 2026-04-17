/**
 * OIDC Auth Feature Implementation - v3 Lazy-Loaded
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside.
 *
 * Loaded when:
 * 1. The feature flag FEATURES.OIDC_AUTH is enabled
 * 2. A consumer calls useLoadFeature(OidcAuthFeature)
 */
import type { OidcAuthContract } from './contract'
import EmailSignInButton from './components/EmailSignInButton'
import GoogleSignInButton from './components/GoogleSignInButton'

const feature: OidcAuthContract = {
  EmailSignInButton,
  GoogleSignInButton,
}

export default feature satisfies OidcAuthContract
