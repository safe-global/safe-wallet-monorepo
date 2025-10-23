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
export const isGuardError = (error: Error & { reason?: string; data?: string }): boolean => {
  if (!error) return false

  const errorMessage = error.message || ''
  const errorReason = error.reason || ''
  const errorData = error.data || ''

  // Check if error contains the UnapprovedHash error code
  return (
    errorMessage.includes(GUARD_ERROR_CODES.UNAPPROVED_HASH) ||
    errorReason.includes(GUARD_ERROR_CODES.UNAPPROVED_HASH) ||
    errorData.includes(GUARD_ERROR_CODES.UNAPPROVED_HASH)
  )
}

/**
 * Detects if an error is specifically the UnapprovedHash Guard error
 * @param error - The error to check
 * @returns true if the error is UnapprovedHash
 */
export const isUnapprovedHashError = (error: Error & { reason?: string; data?: string }): boolean => {
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
