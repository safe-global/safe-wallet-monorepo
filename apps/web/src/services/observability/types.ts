export interface ILogger {
  info: (message: string, context?: Record<string, unknown>) => void
  warn: (message: string, context?: Record<string, unknown>) => void
  error: (message: string, context?: Record<string, unknown>) => void
  debug: (message: string, context?: Record<string, unknown>) => void
}

/**
 * Optional call-site context for a surfaced error. Analytics-agnostic on
 * purpose (no Mixpanel types here) — providers map these to their own event
 * properties. Only populated where the data is genuinely in scope (e.g. a
 * `txHash` exists only once a transaction has been broadcast).
 *
 * Lives in the observability core (not `services/exceptions`) so it can be
 * referenced by both the exceptions layer and analytics providers without
 * closing an import cycle.
 */
export interface ErrorContext {
  txHash?: string
  targetContractLabel?: string
  transactionType?: string
}

/**
 * The normalized analytics input for a surfaced coded error. The raw `message`
 * is used only for classification (taxonomy) and must never be forwarded to a
 * downstream analytics tool.
 */
export interface SurfacedError {
  code: number
  message: string
  isUserFacing: boolean
  context?: ErrorContext
}

/**
 * A single error event reported to observability. Each provider extracts the
 * pieces it needs:
 * - Datadog RUM records `error` (with its stack) via `addError`, but only when
 *   `isUserFacing` — background/logged failures stay off the Error-Free Views SLO.
 * - Mixpanel emits the `Error Surfaced` taxonomy, but only when a `code` is
 *   present (raw crashes without a coded taxonomy are skipped); it never
 *   receives the `error`/`tags`, keeping messages and stacks out of analytics.
 */
export interface ObservedError {
  /** The thrown error, including its stack. */
  error: Error
  /** Whether the error was surfaced to the user (drives Datadog addError and the Mixpanel flag). */
  isUserFacing: boolean
  /** Coded-error number when the error came from `CodedException`; absent for raw crashes. */
  code?: number
  /** Backend tags attached to the Datadog RUM error (error taxonomy, componentStack, …). */
  tags?: Record<string, unknown>
  /** Analytics call-site context (txHash, …) mapped to Mixpanel event properties. */
  context?: ErrorContext
}

export interface IObservabilityProvider {
  readonly name: string
  init: () => void | Promise<void>
  getLogger: () => ILogger
  /**
   * Report an error event. Providers react to the parts they care about, so a
   * single call fans out to raw-exception capture (Datadog) and surfaced-error
   * analytics (Mixpanel) without the caller knowing which sinks are wired.
   */
  captureError: (error: ObservedError) => void
}
