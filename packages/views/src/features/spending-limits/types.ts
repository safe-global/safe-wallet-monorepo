export type SpendingLimitState = {
  beneficiary: string
  token: {
    address: string
    symbol: string
    decimals?: number | null
    logoUri?: string
  }
  amount: string
  nonce: string
  resetTimeMin: string
  lastResetMin: string
  spent: string
}
