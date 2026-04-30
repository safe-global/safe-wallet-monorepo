export const GTF_FEES_BANNER_DISMISSED_KEY = 'gtfFeesBannerDismissed'

/**
 * Whitelist of known Gelato fee-collector addresses. CGW returns the `refundReceiver` to encode
 * into the signed payload; if CGW is ever compromised, an attacker could swap in their own
 * address and drain Safes via `handlePayment()`. Validate against this whitelist client-side as
 * defense-in-depth. Extend as new Gelato relays deploy.
 */
export const GELATO_FEE_COLLECTORS: ReadonlyArray<string> = ['0xc918e75504D1B0c741Eb4236B72Dae7A52401E95']
