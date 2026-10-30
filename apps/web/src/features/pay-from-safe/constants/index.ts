export const PAY_FROM_SAFE_FEES_BANNER_DISMISSED_KEY = 'gtfFeesBannerDismissed' // storage key kept so dismissed banners stay dismissed

/**
 * Phase 1 of Pay from Safe only pays fees in the chain's native token: the selector offers it alone
 * (locked, "more tokens are coming soon"). Flip to `false` to offer the ERC-20s of `GAS_TOKEN_ALLOWLIST`.
 */
export const NATIVE_GAS_TOKEN_ONLY = true

// Defense-in-depth: a compromised CGW could swap in an attacker `refundReceiver` and drain
// Safes via `handlePayment()`. Validate against this list before signing. Extend as needed.
export const FEE_COLLECTORS: ReadonlyArray<string> = [
  // Rhinestone refund receiver (same address on every chain)
  '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD',
]

export * from './gasTokenAllowlist'
