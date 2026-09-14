/**
 * Single source of truth for user-facing copy on known CGW (Safe Client
 * Gateway) HTTP response states — the HTTP-status counterpart to
 * `contractErrors.ts`. Web and mobile both read from here, so the same gateway
 * failure renders the exact same text on every platform.
 *
 * The raw response body is never part of the copy: a gateway can answer with an
 * HTML error page, and rendering that verbatim is what this module exists to
 * prevent. The status is a support reference only (see `getCgwErrorCode`).
 */

/** Shown for every response state we cannot act on: transient, or our own bug. */
export const CGW_ERROR_FALLBACK = 'Something went wrong on our end. Try again.'

/** A Safe Account the gateway refuses to serve for legal reasons. */
export const CGW_SAFE_UNAVAILABLE = 'This Safe Account is not available.'

export interface CgwErrorMeta {
  /** User-facing copy. */
  message: string
  /**
   * Whether reaching this state means *we* sent a bad request and an internal
   * alert is warranted. Never implies anything extra is shown to the user.
   */
  alertsInternally: boolean
}

export const CGW_UNPROCESSABLE_ENTITY = 422
export const CGW_TOO_MANY_REQUESTS = 429
export const CGW_UNAVAILABLE_FOR_LEGAL_REASONS = 451

/**
 * Explicitly mapped states. Statuses absent from here and outside the 5xx range
 * (notably 404) are deliberately unmapped: callers keep their current
 * behaviour rather than inheriting a generic message.
 */
const CGW_ERRORS: Record<number, CgwErrorMeta> = {
  // We sent CGW a malformed request. Same generic copy — the user cannot fix
  // it — but it is our bug, so it alerts internally.
  [CGW_UNPROCESSABLE_ENTITY]: { message: CGW_ERROR_FALLBACK, alertsInternally: true },
  [CGW_TOO_MANY_REQUESTS]: { message: CGW_ERROR_FALLBACK, alertsInternally: false },
  [CGW_UNAVAILABLE_FOR_LEGAL_REASONS]: { message: CGW_SAFE_UNAVAILABLE, alertsInternally: false },
}

/** Any 5xx (502 included) is a gateway-side failure the user cannot act on. */
const CGW_SERVER_ERROR: CgwErrorMeta = { message: CGW_ERROR_FALLBACK, alertsInternally: false }

const isServerErrorStatus = (status: number): boolean => status >= 500 && status <= 599

/** Resolve an HTTP status to its copy contract, or `undefined` if unmapped. */
export const getCgwErrorMeta = (status: number | undefined): CgwErrorMeta | undefined => {
  if (status === undefined) return undefined
  return CGW_ERRORS[status] ?? (isServerErrorStatus(status) ? CGW_SERVER_ERROR : undefined)
}

/**
 * Support reference for the Details panel. Carries the status so support can
 * correlate the report with gateway logs — it never appears in the message.
 */
export const getCgwErrorCode = (status: number): string => `CGW-${status}`

/** Whether this state should raise an internal alert (a bug on our side). */
export const shouldAlertOnCgwStatus = (status: number | undefined): boolean =>
  getCgwErrorMeta(status)?.alertsInternally === true
