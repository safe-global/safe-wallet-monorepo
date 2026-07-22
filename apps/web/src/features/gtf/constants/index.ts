export const GTF_FEES_BANNER_DISMISSED_KEY = 'gtfFeesBannerDismissed'

// Defense-in-depth: a compromised CGW could swap in an attacker `refundReceiver` and drain
// Safes via `handlePayment()`. Validate against this list before signing. Extend as needed.
export const FEE_COLLECTORS: ReadonlyArray<string> = ['0xaEf22e5f09980fC1Ba6F2ec3EC34c1B9aeC885b5']

export * from './gasTokenAllowlist'
