export const OIDC_AUTH_PENDING_KEY = 'oidc_auth_pending'
export const OIDC_AUTH_CONNECTION_KEY = 'oidc_auth_connection'

export const STEP_UP_FAILED_MESSAGE = 'Verification was not completed. Please try again.'

/**
 * `access_denied` also covers an Action denying access or crashing, so the
 * cancellation is told apart by the description Auth0 documents for it.
 * @see https://support.auth0.com/center/s/article/troubleshooting-the-access-denied-error
 */
export const STEP_UP_CANCELLED = { error: 'access_denied', description: 'User has canceled the interaction.' }

export enum OidcConnection {
  EMAIL = 'email',
  GOOGLE = 'google-oauth2',
}

export const DEFAULT_SIGN_IN_ERROR_MESSAGE = 'Something went wrong while signing in with email'

/**
 * Maps known OIDC/Auth0 error_description values to user-friendly messages.
 * Falls back to DEFAULT_SIGN_IN_ERROR_MESSAGE for unknown descriptions.
 */
export const SIGN_IN_ERROR_DESCRIPTION_MAP: Record<string, string> = {
  method_conflict_otp_required: 'You have signed in with this email before. Please continue with email option.',
  method_conflict_google_required: 'You have signed in with Google before. Please continue with Google.',
  method_conflict: 'You have signed in with this email before. Please use your existing sign-in method to continue.',
  multiple_verified_primary_users_found:
    'Multiple accounts found with this email. Please contact support for manual resolution.',
}
