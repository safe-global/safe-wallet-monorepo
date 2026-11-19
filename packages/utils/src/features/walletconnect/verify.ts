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

// Ignores `isScam`: a scam-flagged origin is still where the request came from, which attribution needs to record
export const getAttestedOrigin = (verifyContext?: VerifiedContext & { origin?: string }): string | undefined => {
  if (verifyContext?.validation !== 'VALID') {
    return undefined
  }
  return verifyContext.origin || undefined
}
