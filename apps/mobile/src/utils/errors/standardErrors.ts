export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CLEANUP_ERROR = 'CLEANUP_ERROR',
  USER_CANCELLED = 'USER_CANCELLED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export interface StandardErrorResult<T = unknown> {
  success: boolean
  data?: T
  error?: {
    type: ErrorType
    message: string
    code?: string
    details?: Record<string, unknown>
    originalError?: unknown
  }
}

export function createStandardError(
  type: ErrorType,
  message: string,
  originalError?: unknown,
  details?: Record<string, unknown>,
): StandardErrorResult['error'] {
  return {
    type,
    message,
    code: type,
    details,
    originalError,
  }
}

export function standardizeError(
  error: unknown,
  fallbackType: ErrorType = ErrorType.SYSTEM_ERROR,
  fallbackMessage = 'An unexpected error occurred',
  details?: Record<string, unknown>,
): StandardErrorResult['error'] {
  if (error instanceof Error) {
    return createStandardError(fallbackType, error.message, error, details)
  }

  const message = typeof error === 'string' ? error : fallbackMessage
  return createStandardError(fallbackType, message, error, details)
}

export function createSuccessResult<T>(data?: T): StandardErrorResult<T> {
  return { success: true, data }
}

export function createErrorResult<T>(
  type: ErrorType,
  message: string,
  originalError?: unknown,
  details?: Record<string, unknown>,
): StandardErrorResult<T> {
  return {
    success: false,
    error: createStandardError(type, message, originalError, details),
  }
}
