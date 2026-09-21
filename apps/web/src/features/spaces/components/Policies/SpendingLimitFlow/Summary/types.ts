import type { SafeAccountOption } from '../../SafeAccountSelector/types'

/** What a limit row needs from a token. `decimals` undefined → the amount renders exactly as typed. */
export type LimitSummaryToken = {
  address: string
  symbol: string
  decimals?: number
  logoUri?: string
}

export type LimitSummary = {
  token: LimitSummaryToken
  /** Human-readable amount exactly as typed in the form, e.g. `'0.5466'`. */
  amount: string
  /** Reset period in MINUTES as a string; `'0'` = one time. Recovery stores seconds — never share a helper with it. */
  resetTimeMin: string
}

export type SpenderSummary = {
  address: string
  /** Address-book name; absent → the shortened address is shown. */
  name?: string
  limits: LimitSummary[]
}

/** Everything the confirm-step summary shows. */
export type SpendingLimitSummaryModel = {
  safe: SafeAccountOption
  spenders: SpenderSummary[]
}
