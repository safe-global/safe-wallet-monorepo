import { checkKey } from '../checkIdentity'

const HASH = '0x' + 'aa'.repeat(32)
const SAFE = '0x0000000000000000000000000000000000000abc'
const OTHER_SAFE = '0x00000000000000000000000000000000000000ff'
const IDENTITY = { safeTxHash: HASH, chainId: '100', safeAddress: SAFE }

describe('checkKey', () => {
  it('separates the same hash on two chains', () => {
    // Safe <=1.2.0 omits the chain id from its domain hash, so this is one hash
    // on two chains, not one check.
    expect(checkKey({ ...IDENTITY, chainId: '1' })).not.toBe(checkKey(IDENTITY))
  })

  it('separates the same hash on two Safes', () => {
    expect(checkKey({ ...IDENTITY, safeAddress: OTHER_SAFE })).not.toBe(checkKey(IDENTITY))
  })

  it('separates two hashes of one Safe', () => {
    expect(checkKey({ ...IDENTITY, safeTxHash: '0x' + 'bb'.repeat(32) })).not.toBe(checkKey(IDENTITY))
  })

  it('reads the same key however the Safe address is cased', () => {
    expect(checkKey({ ...IDENTITY, safeAddress: SAFE.toUpperCase().replace('0X', '0x') })).toBe(checkKey(IDENTITY))
  })
})
