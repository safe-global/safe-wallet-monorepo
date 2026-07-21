import { resolveScannedAddress } from './scannedAddress'

const VALID_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

describe('resolveScannedAddress', () => {
  it('recognises a bare checksummed address', () => {
    expect(resolveScannedAddress(VALID_ADDRESS)).toEqual({ address: VALID_ADDRESS, prefix: undefined })
  })

  it('recognises a prefixed address and keeps the prefix', () => {
    expect(resolveScannedAddress(`eth:${VALID_ADDRESS}`)).toEqual({ address: VALID_ADDRESS, prefix: 'eth' })
  })

  it('returns null for non-address values', () => {
    expect(resolveScannedAddress('https://example.com')).toBeNull()
    expect(resolveScannedAddress('wc:topic@2?relay-protocol=irn')).toBeNull()
  })
})
