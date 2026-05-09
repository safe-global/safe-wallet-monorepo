import Logger from '@/src/utils/logger'

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  enableJitter?: boolean
  retryAllErrors?: boolean
}

/**
 * Utility for retrying operations with configurable backoff strategies
 */
export const withRetry = async <T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const { maxRetries = 3, baseDelay = 1000, enableJitter = false, retryAllErrors = false } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        throw lastError
      }

      // Determine if we should retry this error
      const shouldRetry = retryAllErrors || isRetryableError(error)

      if (!shouldRetry) {
        throw lastError
      }

      // Calculate delay with appropriate strategy
      const delay = calculateDelay(attempt, baseDelay, enableJitter, isRateLimitError(error))

      Logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`, {
        error: lastError.message,
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
      })

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    if ('status' in error && (error as { status: number }).status === 429) {
      return true
    }

    if ('message' in error) {
      const message = (error as { message: string }).message.toLowerCase()
      return message.includes('429') || message.includes('rate limit') || message.includes('too many requests')
    }
  }

  return false
}

function isRetryableError(error: unknown): boolean {
  return isRateLimitError(error)
}

function calculateDelay(attempt: number, baseDelay: number, enableJitter: boolean, isRateLimit: boolean): number {
  if (isRateLimit) {
    // Exponential backoff for rate limits
    const exponentialDelay = baseDelay * Math.pow(2, attempt)
    const jitter = enableJitter ? Math.random() * 1000 : 0
    return exponentialDelay + jitter
  } else {
    // Linear backoff for other errors
    return baseDelay * (attempt + 1)
  }
}

export const withRateLimitRetry = <T>(operation: () => Promise<T>, maxRetries = 3) =>
  withRetry(operation, { maxRetries, enableJitter: true })

export const withGeneralRetry = <T>(operation: () => Promise<T>, maxRetries = 3) =>
  withRetry(operation, { maxRetries, retryAllErrors: true })
