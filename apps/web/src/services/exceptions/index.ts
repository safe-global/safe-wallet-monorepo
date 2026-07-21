import { IS_PRODUCTION } from '@/config/constants'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { logger, captureException } from '../observability'

/**
 * Sink for surfaced errors, registered by the analytics layer at app startup
 * (see WA-2775). Kept as an injected callback so this low-level logger never
 * imports the analytics/Mixpanel module graph — that coupling would create an
 * import cycle, since the analytics layer is itself a consumer of `logError`.
 */
/**
 * Optional call-site context for a surfaced error. Analytics-agnostic on
 * purpose (no Mixpanel types here) — the analytics layer maps these to event
 * properties. Only populated where the data is genuinely in scope (e.g. a
 * `txHash` exists only once a transaction has been broadcast).
 */
export interface ErrorContext {
  txHash?: string
  targetContractLabel?: string
  transactionType?: string
}

export type ErrorSurfacedHandler = (params: {
  code: number
  message: string
  isUserFacing: boolean
  context?: ErrorContext
}) => void

let errorSurfacedHandler: ErrorSurfacedHandler | undefined

export const setErrorSurfacedHandler = (handler: ErrorSurfacedHandler | undefined): void => {
  errorSurfacedHandler = handler
}

export class CodedException extends Error {
  public readonly code: number
  public readonly content: string

  private getCode(content: ErrorCodes): number {
    const codePrefix = content.split(':')[0]
    const code = Number(codePrefix)
    if (isNaN(code)) {
      throw new CodedException(ErrorCodes.___0, codePrefix)
    }
    return code
  }

  constructor(content: ErrorCodes, thrown?: unknown) {
    super()

    const extraInfo = thrown ? ` (${asError(thrown).message})` : ''
    this.message = `Code ${content}${extraInfo}`
    this.code = this.getCode(content)
    this.content = content
  }

  /**
   * Default log path for caught exceptions: routed to logger.warn so it lands
   * in Datadog as an `addAction` (level=warn) rather than an `addError`. These
   * are not counted against the Error-Free Views SLO. Use `track()` / `trackError`
   * for failures that truly break a user action.
   */
  public log(context?: ErrorContext): void {
    // Filter out the logError fn from the stack trace
    if (this.stack) {
      const newStack = this.stack
        .split('\n')
        .filter((line) => !line.includes(logError.name))
        .join('\n')
      try {
        this.stack = newStack
      } catch (e) {}
    }

    console.warn(IS_PRODUCTION ? this.message : this)

    if (IS_PRODUCTION) {
      logger.warn(this.message, { code: this.code })
      errorSurfacedHandler?.({ code: this.code, message: this.message, isUserFacing: false, context })
    }
  }

  public track(context?: ErrorContext): void {
    console.error(IS_PRODUCTION ? this.message : this)

    if (IS_PRODUCTION) {
      logger.error(this.message, { code: this.code })
      captureException(this)
      errorSurfacedHandler?.({ code: this.code, message: this.message, isUserFacing: true, context })
    }
  }
}

type ErrorHandler = (content: ErrorCodes, thrown?: unknown, context?: ErrorContext) => CodedException

/**
 * Log a caught exception as a warning. Does NOT count against the RUM
 * Error-Free Views SLO. Use for recoverable / background / expected failures.
 */
export const logError: ErrorHandler = function logError(content, thrown, context) {
  const error = new CodedException(content, thrown)
  error.log(context)
  return error
}

/**
 * Report a user-impacting error. Logs at error level AND forwards to the
 * observability exception channel (Datadog RUM addError + Sentry), so it
 * DOES count against Error-Free Views. Use for failed user actions.
 */
export const trackError: ErrorHandler = function trackError(content, thrown, context) {
  const error = new CodedException(content, thrown)
  error.track(context)
  return error
}

export const Errors = ErrorCodes
