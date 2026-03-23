/**
 * Compute fiat value from a token amount and its fiat conversion rate.
 * Returns null if fiat conversion is unavailable or the amount is non-positive.
 */
export const computeFiatValue = (tokenAmount: number, fiatConversion: string | undefined): number | null => {
  if (!fiatConversion || fiatConversion === '0') return null
  if (!tokenAmount || tokenAmount <= 0) return null
  return tokenAmount * parseFloat(fiatConversion)
}
