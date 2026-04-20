import { IS_PRODUCTION } from '@/config/constants'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { logger, captureException } from '../observability'

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
  public log(): void {
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
    }
  }

  public track(): void {
    console.error(IS_PRODUCTION ? this.message : this)

    if (IS_PRODUCTION) {
      logger.error(this.message, { code: this.code })
      captureException(this)
    }
  }
}

type ErrorHandler = (content: ErrorCodes, thrown?: unknown) => CodedException

/**
 * Log a caught exception as a warning. Does NOT count against the RUM
 * Error-Free Views SLO. Use for recoverable / background / expected failures.
 */
export const logError: ErrorHandler = function logError(...args) {
  const error = new CodedException(...args)
  error.log()
  return error
}

/**
 * Report a user-impacting error. Logs at error level AND forwards to the
 * observability exception channel (Datadog RUM addError + Sentry), so it
 * DOES count against Error-Free Views. Use for failed user actions.
 */
export const trackError: ErrorHandler = function trackError(...args) {
  const error = new CodedException(...args)
  error.track()
  return error
}

export const Errors = ErrorCodes
