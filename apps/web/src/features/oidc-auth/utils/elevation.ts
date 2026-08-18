/**
 * Error message CGW's `ElevationGuard` returns when a sensitive Workspace
 * action needs a fresh second factor (step-up authentication).
 *
 * It is deliberately a distinct 403 body rather than a 401 so clients can tell
 * "redo MFA" apart from a plain authorization failure.
 *
 * @see https://github.com/safe-global/safe-client-gateway/pull/3315
 */
export const ELEVATION_REQUIRED_ERROR = 'elevation_required'

const HTTP_FORBIDDEN = 403

/**
 * User-facing copy for the raw `elevation_required` token, which is a protocol
 * marker rather than a message written for humans.
 */
export const ELEVATION_REQUIRED_MESSAGE = 'Verify your identity to continue with this action.'

/**
 * Whether an RTK Query error is CGW's step-up challenge.
 *
 * Both the status and the message are checked: a 403 alone covers ordinary
 * "not an admin of this space" rejections, which must keep rendering as
 * authorization failures rather than sending the user through MFA.
 */
export const isElevationRequiredError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false
  if (!('status' in error) || error.status !== HTTP_FORBIDDEN) return false
  if (!('data' in error) || typeof error.data !== 'object' || error.data === null) return false

  return 'message' in error.data && error.data.message === ELEVATION_REQUIRED_ERROR
}
