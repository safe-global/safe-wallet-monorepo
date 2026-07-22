import { IS_PRODUCTION } from '@/config/constants'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { normalizeError } from '@safe-global/utils/services/exceptions/normalizeError'
import { logger, captureError } from '../observability'
import type { ErrorContext } from '../observability/types'

/**
 * Re-exported from the observability core so existing call sites can keep
 * importing `ErrorContext` from `@/services/exceptions`. It lives in the core
 * (not here) so both the exceptions layer and analytics providers can reference
 * it without closing an import cycle — the analytics layer is itself a consumer
 * of `logError` (see WA-2775).
 */
export type { ErrorContext }

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
  /**
   * Context attached to the Datadog RUM error/action, so issues can be grouped
   * by the same taxonomy as the Mixpanel `Error Surfaced` event and reconciled
   * across the two tools (WA-2775). Namespaced `error_*` to avoid colliding with
   * Datadog's built-in `@type` field.
   */
  private getObservabilityContext(): Record<string, unknown> {
    const { domain, type, layer } = normalizeError({ code: this.code, message: this.message, isUserFacing: false })
    return { code: this.code, error_domain: domain, error_type: type, error_layer: layer }
  }

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
      const tags = this.getObservabilityContext()
      logger.warn(this.message, tags)
      captureError({ error: this, isUserFacing: false, code: this.code, tags, context })
    }
  }

  public track(context?: ErrorContext): void {
    console.error(IS_PRODUCTION ? this.message : this)

    if (IS_PRODUCTION) {
      const tags = this.getObservabilityContext()
      logger.error(this.message, tags)
      captureError({ error: this, isUserFacing: true, code: this.code, tags, context })
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
