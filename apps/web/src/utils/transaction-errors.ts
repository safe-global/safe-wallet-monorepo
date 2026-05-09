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
 * Detects if an error is a Guard revert error and returns the error name
 * @param {Error} error - The error to check
 * @returns {string | undefined} The human-readable error name if it's a guard error, undefined otherwise
 */
export const getGuardErrorInfo = (error: Error): string | undefined => {
  const errorCode = extractGuardErrorCode(error)
  return errorCode ? getGuardErrorName(errorCode) : undefined
}

/**
 * Extracts the Guard error code from an error message
 * @param {Error} error - The error to extract from
 * @returns {string | undefined} The error code if found, undefined otherwise
 */
export const extractGuardErrorCode = (error: Error): string | undefined => {
  if (!error) return undefined

  const errorMessage = error.message || ''

  // Check for each known guard error code in the message
  for (const code of Object.values(GUARD_ERROR_CODES)) {
    if (errorMessage.includes(code)) {
      return code
    }
  }

  return undefined
}

/**
 * Gets a human-readable error name from a Guard error code
 * @param {string} errorCode - The error code (e.g., '0x70cc6907')
 * @returns {string} Human-readable error name
 */
export const getGuardErrorName = (errorCode: string): string => {
  switch (errorCode) {
    case GUARD_ERROR_CODES.UNAPPROVED_HASH:
      return 'UnapprovedHash'
    default:
      return 'Unknown'
  }
}

/**
 * Detects if an error is a Guard revert error
 * @param {Error} error - The error to check
 * @returns {boolean} true if the error is a Guard revert
 */
export const isGuardError = (error: Error): boolean => {
  return extractGuardErrorCode(error) !== undefined
}
