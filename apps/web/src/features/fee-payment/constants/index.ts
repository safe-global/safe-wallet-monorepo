import { sameAddress } from '@safe-global/utils/utils/addresses'

export const PAY_FROM_SAFE_FEES_BANNER_DISMISSED_KEY = 'gtfFeesBannerDismissed' // storage key kept so dismissed banners stay dismissed

/** Phase 1 pays fees in the native token only; `false` offers the ERC-20s of `GAS_TOKEN_ALLOWLIST`. */
export const NATIVE_GAS_TOKEN_ONLY = true

// A compromised CGW could swap in its own refundReceiver: never sign against one not listed here.
export const FEE_COLLECTORS: ReadonlyArray<string> = [
  // Rhinestone refund receiver (same address on every chain)
  '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD',
]

/** Whether a `refundReceiver` quoted by the CGW is one of the known fee collectors. */
export const isFeeCollector = (address: string): boolean => FEE_COLLECTORS.some((addr) => sameAddress(addr, address))

export * from './gasTokenAllowlist'
