import { getAttestedOrigin, verifyStatusToVariant } from '../verify'

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

describe('getAttestedOrigin', () => {
  const origin = 'https://app.uniswap.org'

  it('returns the origin when Verify validated it', () => {
    expect(getAttestedOrigin({ validation: 'VALID', origin })).toBe(origin)
  })

  it('returns nothing when the origin does not match the dApp', () => {
    expect(getAttestedOrigin({ validation: 'INVALID', origin })).toBeUndefined()
  })

  it('returns nothing when Verify could not attest the origin', () => {
    expect(getAttestedOrigin({ validation: 'UNKNOWN', origin })).toBeUndefined()
  })

  it('returns nothing when there is no verify context', () => {
    expect(getAttestedOrigin(undefined)).toBeUndefined()
  })
})
