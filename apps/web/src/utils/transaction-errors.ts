/**
 * Utilities for detecting and handling specific transaction errors
 */

/**
 * Guard error codes
 */
export const GUARD_ERROR_CODES = {
  UNAPPROVED_HASH: '0x70cc6907',
} as const

/**
 * Detects if an error is a Guard revert error
 * @param error - The error to check
 * @returns true if the error is a Guard revert
 */
export const isGuardError = (error: Error): boolean => {
  if (!error) return false

  const errorMessage = error.message || ''

  // Check if error message contains the UnapprovedHash error code
  // Note: After error sanitization via asError(), the guard error code is preserved in the message
  return errorMessage.includes(GUARD_ERROR_CODES.UNAPPROVED_HASH)
}

/**
 * Detects if an error is specifically the UnapprovedHash Guard error
 * @param error - The error to check
 * @returns true if the error is UnapprovedHash
 */
export const isUnapprovedHashError = (error: Error): boolean => {
  return isGuardError(error)
}

/**
 * Gets a human-readable error name from a Guard error code
 * @param errorCode - The error code (e.g., '0x70cc6907')
 * @returns Human-readable error name
 */
export const getGuardErrorName = (errorCode: string): string => {
  switch (errorCode) {
    case GUARD_ERROR_CODES.UNAPPROVED_HASH:
      return 'UnapprovedHash'
    default:
      return 'Unknown'
  }
}
