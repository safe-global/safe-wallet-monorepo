/**
 * Deliberately a distinct 403 body rather than a 401, so clients can tell "redo
 * MFA" apart from a plain authorization failure.
 *
 * @see https://github.com/safe-global/safe-client-gateway/pull/3315
 */
export const ELEVATION_REQUIRED_ERROR = 'elevation_required'

const HTTP_FORBIDDEN = 403

export const ELEVATION_REQUIRED_MESSAGE = 'Verify your identity to continue with this action.'

/**
 * The message is checked as well as the status: a 403 alone covers ordinary "not
 * an admin of this space" rejections, which must keep rendering as authorization
 * failures rather than sending the user through MFA.
 */
export const isElevationRequiredError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false
  if (!('status' in error) || error.status !== HTTP_FORBIDDEN) return false
  if (!('data' in error) || typeof error.data !== 'object' || error.data === null) return false

  return 'message' in error.data && error.data.message === ELEVATION_REQUIRED_ERROR
}
