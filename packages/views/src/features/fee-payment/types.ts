export type FeePaymentMode = 'safe' | 'signer'

export type FeeRow = {
  label: string
  amount?: string
  currency?: string
  fiatAmount?: string
  isFree?: boolean
  /** When set, replaces the amount/currency/fiat slot with explanatory copy (e.g. "Calculated at execution"). */
  note?: string
}

export type HistoryFeesData = {
  totalFee: { amount: string; currency: string; fiatAmount?: string }
  executionFee: FeeRow
  gasFee: FeeRow
  paidFrom: 'safe' | 'signer'
}

export type GasPayerChoice = 'SPONSORED' | 'PAY_FROM_SAFE' | 'WALLET'

export type GasTokenOption = { address: string; symbol: string; logoUri: string; fiatBalance?: string }

export type NetworkFee = {
  amount?: string
  currency?: string
  fiatAmount?: string
  note?: string
  loading?: boolean
  error?: boolean
}

export type OutgoingLine = { amount: string; currency: string }

export type TotalOutgoingView = { primary: OutgoingLine[]; fees?: OutgoingLine; fiatTotal: string }

/** Why the payer is locked, when it is not the default for its value. The view picks the copy. */
export type PayerLockReason = 'FIRST_SIGNER_PICKS'

/** Why the fee token is locked. Without one the view explains the signer-pays case. */
export type GasTokenLockReason = 'SET_AT_SIGNING' | 'NATIVE_ONLY' | 'SPONSORED'

export type FeePayerControl =
  | { kind: 'choice'; value: GasPayerChoice; options: GasPayerChoice[] }
  | { kind: 'locked'; value: GasPayerChoice; reason?: PayerLockReason }

export type FeePayerFooter =
  | { kind: 'none' }
  | { kind: 'upsell' }
  | { kind: 'counter'; left: number | null; quota: number | null; resetsAt: string | null; isSubscription: boolean }

export type FeePayerView = {
  payer: FeePayerControl
  gasToken: { tokens: GasTokenOption[]; selected: string; locked: boolean; lockedReason?: GasTokenLockReason }
  executionFee: NetworkFee
  gasFee: NetworkFee
  sponsored: boolean
  /** The Workspace's plan ("Pro plan") or the chain's free relays ("Free transaction"). */
  sponsorKind: 'plan' | 'free'
  totalOutgoing?: TotalOutgoingView
  footer: FeePayerFooter
  /** Safe-pays only: false when the Safe cannot cover the fee. */
  safeHasEnoughGas?: boolean
}
