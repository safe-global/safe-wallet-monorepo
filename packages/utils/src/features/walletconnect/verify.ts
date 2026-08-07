export type VerifyVariant = 'verified' | 'unverified' | 'malicious'

// Structural subset of WalletConnect's `Verify.Context['verified']`. Kept local so this
// shared module stays free of a `@walletconnect/types` dependency.
export type VerifiedContext = {
  isScam?: boolean
  validation?: 'VALID' | 'INVALID' | 'UNKNOWN' | string
}

export const verifyStatusToVariant = (verifyContext?: VerifiedContext): VerifyVariant => {
  if (!verifyContext) {
    return 'unverified'
  }
  if (verifyContext.isScam) {
    return 'malicious'
  }
  if (verifyContext.validation === 'VALID') {
    return 'verified'
  }
  return 'unverified' // UNKNOWN or INVALID
}
