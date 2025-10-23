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
 * Extracts the Guard error code from an error message
 * @param error - The error to extract from
 * @returns The error code if found, undefined otherwise
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
 * Detects if an error is a Guard revert error and returns the error name
 * @param error - The error to check
 * @returns The human-readable error name if it's a guard error, undefined otherwise
 */
export const getGuardErrorInfo = (error: Error): string | undefined => {
  const errorCode = extractGuardErrorCode(error)
  return errorCode ? getGuardErrorName(errorCode) : undefined
}

/**
 * Detects if an error is a Guard revert error
 * @param error - The error to check
 * @returns true if the error is a Guard revert
 */
export const isGuardError = (error: Error): boolean => {
  return extractGuardErrorCode(error) !== undefined
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
