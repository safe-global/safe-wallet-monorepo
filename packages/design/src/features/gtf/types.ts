export type GtfPaymentMode = 'safe' | 'signer'

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
