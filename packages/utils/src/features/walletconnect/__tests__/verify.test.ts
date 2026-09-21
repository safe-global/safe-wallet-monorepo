import { verifyStatusToVariant } from '../verify'

describe('verifyStatusToVariant', () => {
  it('returns unverified when context is missing', () => {
    expect(verifyStatusToVariant(undefined)).toBe('unverified')
  })

  it('returns malicious when isScam, even if validation is VALID', () => {
    expect(verifyStatusToVariant({ isScam: true, validation: 'VALID' })).toBe('malicious')
  })

  it('returns verified for VALID and not scam', () => {
    expect(verifyStatusToVariant({ validation: 'VALID' })).toBe('verified')
  })

  it('returns unverified for UNKNOWN and INVALID', () => {
    expect(verifyStatusToVariant({ validation: 'UNKNOWN' })).toBe('unverified')
    expect(verifyStatusToVariant({ validation: 'INVALID' })).toBe('unverified')
  })
})
