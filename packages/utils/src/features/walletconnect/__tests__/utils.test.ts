import { extractWcUri, isPairingUri, toHex } from '../utils'

describe('toHex', () => {
  it('converts numeric chain ids to hex', () => {
    expect(toHex('1')).toBe('0x1')
    expect(toHex('137')).toBe('0x89')
    expect(toHex(11155111)).toBe('0xaa36a7')
  })

  it('normalizes a 0x-hex input to a canonical quantity', () => {
    expect(toHex('0x010')).toBe('0x10')
    expect(toHex('0x0')).toBe('0x0')
  })

  it('preserves precision above 2^53 (BigInt, not Number)', () => {
    // 0x20000000000001 = 2^53 + 1 — Number would round this down to 2^53.
    expect(toHex('0x20000000000001')).toBe('0x20000000000001')
  })
})

describe('isPairingUri', () => {
  it('accepts wc: URIs and rejects everything else', () => {
    expect(isPairingUri('wc:abc@2?relay-protocol=irn')).toBe(true)
    expect(isPairingUri('safe://wc?uri=wc%3Aabc')).toBe(false)
    expect(isPairingUri('https://app.safe.global/foo')).toBe(false)
  })
})

describe('extractWcUri', () => {
  const wcUri = 'wc:abc123@2?relay-protocol=irn&symKey=deadbeef'

  it('returns a bare wc: URI unchanged', () => {
    expect(extractWcUri(wcUri)).toBe(wcUri)
  })

  it('unwraps the native registry envelope (safe://wc?uri=…)', () => {
    expect(extractWcUri(`safe://wc?uri=${encodeURIComponent(wcUri)}`)).toBe(wcUri)
  })

  it('unwraps the universal-link envelope (https://app.safe.global/wc?uri=…)', () => {
    expect(extractWcUri(`https://app.safe.global/wc?uri=${encodeURIComponent(wcUri)}`)).toBe(wcUri)
  })

  it('returns null for a link without a pairing uri', () => {
    expect(extractWcUri('https://app.safe.global/foo')).toBeNull()
    expect(extractWcUri('safe://settings')).toBeNull()
  })

  it('returns null when the wrapped uri is not a wc: URI', () => {
    expect(extractWcUri(`safe://wc?uri=${encodeURIComponent('https://evil.example')}`)).toBeNull()
  })

  it('returns null for unparseable input', () => {
    expect(extractWcUri('not a url')).toBeNull()
    expect(extractWcUri('')).toBeNull()
  })
})
