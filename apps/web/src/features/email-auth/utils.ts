import { EMAIL_AUTH_PENDING_KEY } from './hooks/useEmailLogin'

/**
 * Returns true while the email login redirect is in progress.
 *
 * The flag is set in sessionStorage before the OIDC redirect and
 * cleared by useEmailLoginCallback on page load. This prevents
 * Spaces from flashing the signed-out state while the callback
 * processes.
 */
export const isEmailLoginPending = () => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(EMAIL_AUTH_PENDING_KEY) === '1'
}
