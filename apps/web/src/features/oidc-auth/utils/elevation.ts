/**
 * A 403 with its own message rather than a 401, so clients can tell "verify
 * again" apart from "you are not allowed to do this".
 *
 * @see https://github.com/safe-global/safe-client-gateway/pull/3315
 */
export const ELEVATION_REQUIRED_ERROR = 'elevation_required'

const HTTP_FORBIDDEN = 403

export const ELEVATION_REQUIRED_MESSAGE = 'Verify your identity to continue with this action.'

/**
 * The message is checked as well as the status. A 403 on its own also covers
 * ordinary "you are not an admin of this space" errors, and those must stay
 * ordinary errors instead of starting a verification.
 */
export const isElevationRequiredError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false
  if (!('status' in error) || error.status !== HTTP_FORBIDDEN) return false
  if (!('data' in error) || typeof error.data !== 'object' || error.data === null) return false

  return 'message' in error.data && error.data.message === ELEVATION_REQUIRED_ERROR
}
