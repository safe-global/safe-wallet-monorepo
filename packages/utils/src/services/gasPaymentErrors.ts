import { parseGasPaymentOptions, type GasPaymentOption } from '@safe-global/utils/utils/gasPaymentOptions'

export const GAS_PAYMENT_OPTION_UNAVAILABLE_CODE = 'GAS_PAYMENT_OPTION_UNAVAILABLE'

// CGW reasons: NOT_LISTED | NO_RELAYER | NOT_A_WORKSPACE_SAFE | REFUNDING_TRANSACTION
export const REFUNDING_TRANSACTION_REASON = 'REFUNDING_TRANSACTION'

/** The CGW's HTTP 409: the requested gas payment option cannot pay for this transaction. */
export class GasPaymentOptionUnavailableError extends Error {
  constructor(
    readonly requested: GasPaymentOption | null,
    readonly reason: string,
    readonly available: GasPaymentOption[],
    message: string,
  ) {
    super(message)
    this.name = 'GasPaymentOptionUnavailableError'
  }
}

/** The chain route's HTTP 429: the daily or campaign quota is spent. */
export class RelayLimitReachedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RelayLimitReachedError'
  }
}

/** The chain route's 403 `No relayer defined`: the chain lists no free option (stale config on the client). */
export class RelayerUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RelayerUnavailableError'
  }
}

const getErrorBody = (thrown: unknown): { status: unknown; data: Record<string, unknown> } | undefined => {
  if (typeof thrown !== 'object' || thrown === null || !('data' in thrown)) return undefined
  const { status, data } = thrown as { status?: unknown; data?: unknown }
  if (typeof data !== 'object' || data === null) return undefined
  return { status, data: data as Record<string, unknown> }
}

const getMessage = (data: Record<string, unknown>, fallback: string): string =>
  typeof data.message === 'string' ? data.message : fallback

export const getGasPaymentOptionUnavailableError = (thrown: unknown): GasPaymentOptionUnavailableError | undefined => {
  const body = getErrorBody(thrown)
  if (body?.data.code !== GAS_PAYMENT_OPTION_UNAVAILABLE_CODE) return undefined
  const { requested, reason, available } = body.data

  return new GasPaymentOptionUnavailableError(
    parseGasPaymentOptions([requested])[0] ?? null,
    typeof reason === 'string' ? reason : 'unknown',
    parseGasPaymentOptions(available),
    getMessage(body.data, 'Gas payment option unavailable'),
  )
}

export const getRelayLimitReachedError = (thrown: unknown): RelayLimitReachedError | undefined => {
  const body = getErrorBody(thrown)
  if (body?.status !== 429) return undefined
  return new RelayLimitReachedError(getMessage(body.data, 'Relay limit reached'))
}

export const getRelayerUnavailableError = (thrown: unknown): RelayerUnavailableError | undefined => {
  const body = getErrorBody(thrown)
  if (body?.status !== 403) return undefined
  return new RelayerUnavailableError(getMessage(body.data, 'No relayer defined'))
}
