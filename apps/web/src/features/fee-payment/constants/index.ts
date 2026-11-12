export const PAY_FROM_SAFE_FEES_BANNER_DISMISSED_KEY = 'gtfFeesBannerDismissed'

// flip to `true` to restore the Safe-pays UI and signing once relaying ships.
export const IS_RELAYING_LIVE = false

// Defense-in-depth: a compromised CGW could swap in an attacker `refundReceiver` and drain
// Safes via `handlePayment()`. Validate against this list before signing. Extend as needed.
export const FEE_COLLECTORS: ReadonlyArray<string> = ['0x0C51b4d70492D81f9f96B1EB1a826FBfb3fd27d8']

/** The account Rhinestone relays from today. It may change; `RHINESTONE_INTENT_EXECUTOR` is the stable signal. */
export const RHINESTONE_RELAYER = '0x46565eeDB0bb948aE787dD105cCE300f736dA28e'

/** Rhinestone's executor contract (same address on every chain): it emits `IntentExecuted` in every relayed tx. */
export const RHINESTONE_INTENT_EXECUTOR = '0x781388759EacB9892f60D77D9A99c9BE2F7F4ada'

export * from './gasTokenAllowlist'
