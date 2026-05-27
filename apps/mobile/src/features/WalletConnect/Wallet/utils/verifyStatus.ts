import type { Verify } from '@walletconnect/types'

export type VerifyVariant = 'verified' | 'unverified' | 'malicious'

export const verifyStatusToVariant = (verifyContext?: Verify.Context['verified']): VerifyVariant => {
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
