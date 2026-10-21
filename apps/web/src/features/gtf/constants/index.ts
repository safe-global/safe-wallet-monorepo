export const GTF_FEES_BANNER_DISMISSED_KEY = 'gtfFeesBannerDismissed'

/**
 * Open decision B of the fee payment spec: whether the free plan may pay from the Safe (network fee +
 * premium) or Pay from Safe is Pro-only and the upgrade hook. `true` renders the spec's free-plan
 * toggle with the "+ premium" variant; `false` renders "Pay from signer" with the Pro upsell.
 */
export const PAY_FROM_SAFE_ON_FREE_PLAN = true

// flip to `true` to restore the Safe-pays UI and signing once relaying ships.
// SMOKE TEST (feat/pay-from-safe): enabled locally to exercise Pay from Safe against staging. Do not merge.
export const IS_RELAYING_LIVE = true

// Defense-in-depth: a compromised CGW could swap in an attacker `refundReceiver` and drain
// Safes via `handlePayment()`. Validate against this list before signing. Extend as needed.
export const FEE_COLLECTORS: ReadonlyArray<string> = [
  // Rhinestone refund receiver (same address on every chain)
  '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD',
]

export * from './gasTokenAllowlist'
