export const GTF_FEES_BANNER_DISMISSED_KEY = 'gtfFeesBannerDismissed'

// flip to `true` to restore the Safe-pays UI and signing once relaying ships.
// SMOKE TEST (feat/pay-from-safe): enabled locally to exercise Pay from Safe against staging. Do not merge.
export const IS_RELAYING_LIVE = true

// Defense-in-depth: a compromised CGW could swap in an attacker `refundReceiver` and drain
// Safes via `handlePayment()`. Validate against this list before signing. Extend as needed.
export const FEE_COLLECTORS: ReadonlyArray<string> = [
  '0x0C51b4d70492D81f9f96B1EB1a826FBfb3fd27d8',
  // SMOKE TEST (feat/pay-from-safe): the `refundReceiver` the staging fee-service returns for Sepolia today.
  // It is a team test EOA left over from GTF, not a relayer collector. Do not merge.
  '0xc918e75504D1B0c741Eb4236B72Dae7A52401E95',
]

export * from './gasTokenAllowlist'
