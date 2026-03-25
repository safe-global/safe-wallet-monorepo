/**
 * Email Auth Feature Implementation - v3 Lazy-Loaded
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside.
 *
 * Loaded when:
 * 1. The feature flag FEATURES.EMAIL_AUTH is enabled
 * 2. A consumer calls useLoadFeature(EmailAuthFeature)
 */
import type { EmailAuthContract } from './contract'
import EmailSignInButton from './components/EmailSignInButton'
import GoogleSignInButton from './components/GoogleSignInButton'

const feature: EmailAuthContract = {
  EmailSignInButton,
  GoogleSignInButton,
}

export default feature satisfies EmailAuthContract
