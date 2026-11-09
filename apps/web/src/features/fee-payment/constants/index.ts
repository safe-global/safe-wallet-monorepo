import { sameAddress } from '@safe-global/utils/utils/addresses'

export const PAY_FROM_SAFE_FEES_BANNER_DISMISSED_KEY = 'feeInfoBannerDismissed'

/* TODO: Remove this constant once the fee payment feature is fully released. */
/** Phase 1 pays fees in the native token only; `false` offers the ERC-20s of `GAS_TOKEN_ALLOWLIST`. */
export const NATIVE_GAS_TOKEN_ONLY = true

export const FEE_COLLECTORS: ReadonlyArray<string> = [
  // Rhinestone refund receiver (same address on every chain)
  '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD',
]

export const isFeeCollector = (address: string): boolean => FEE_COLLECTORS.some((addr) => sameAddress(addr, address))

export * from './gasTokenAllowlist'
