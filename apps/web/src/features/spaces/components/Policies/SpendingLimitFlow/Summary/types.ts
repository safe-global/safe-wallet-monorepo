import type { SafeAccountOption } from '../../SafeAccountSelector/types'

/** What a limit row needs from a token. `decimals` undefined → the amount renders exactly as typed. */
export type LimitSummaryToken = {
  address: string
  symbol: string
  decimals?: number
  logoUri?: string
}

/** How this row differs from what the chain holds. Absent in the create flow, where nothing is being changed. */
export type LimitChange = 'added' | 'changed' | 'unchanged' | 'removed'

export type LimitSummary = {
  token: LimitSummaryToken
  /** Human-readable amount exactly as typed in the form, e.g. `'0.5466'`. */
  amount: string
  /** Reset period in MINUTES as a string; `'0'` = one time. Recovery stores seconds — never share a helper with it. */
  resetTimeMin: string
  change?: LimitChange
  /** What the chain holds today; set for `changed` and `removed` so the row can show both sides. */
  previous?: { amount: string; resetTimeMin: string }
  /** Base units already spent this period — the amount a reset hands back. Only set when non-zero. */
  spent?: string
}

export type SpenderSummary = {
  address: string
  /** Address-book name; absent → the shortened address is shown. */
  name?: string
  limits: LimitSummary[]
  /** Set only when the whole spender is arriving or leaving. */
  change?: 'added' | 'removed'
}

/** Everything the confirm-step summary shows. */
export type SpendingLimitSummaryModel = {
  safe: SafeAccountOption
  spenders: SpenderSummary[]
}
