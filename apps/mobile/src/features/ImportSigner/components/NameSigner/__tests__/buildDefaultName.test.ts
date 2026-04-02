import { buildDefaultName } from '../buildDefaultName'

describe('buildDefaultName', () => {
  it('uses wallet name and last 4 address chars', () => {
    expect(buildDefaultName('MetaMask', '0x1234567890abcdef3456')).toBe('MetaMask - 3456')
  })

  it('falls back to "Signer" when walletName is undefined', () => {
    expect(buildDefaultName(undefined, '0x1234567890abcdef3456')).toBe('Signer - 3456')
  })

  it('falls back to "Signer" when walletName is empty string', () => {
    expect(buildDefaultName('', '0x1234567890abcdef3456')).toBe('Signer - 3456')
  })

  it('truncates with ellipsis when total exceeds 20 chars', () => {
    // "Ledger Live Mobile - 3456" = 25 chars, truncated to 19 + ellipsis
    const result = buildDefaultName('Ledger Live Mobile', '0x1234567890abcdef3456')
    expect(result.length).toBe(20)
    expect(result).toBe('Ledger Live Mobile \u2026')
  })

  it('keeps names exactly 20 chars without truncation', () => {
    // "TrustWallet - 3456" = 18 chars, fits fine
    expect(buildDefaultName('TrustWallet', '0x1234567890abcdef3456')).toBe('TrustWallet - 3456')
  })

  it('handles very long wallet names', () => {
    const result = buildDefaultName('A Very Long Wallet Name That Exceeds', '0x1234567890abcdef3456')
    expect(result.length).toBe(20)
    expect(result.endsWith('\u2026')).toBe(true)
  })

  it('handles single character wallet name', () => {
    expect(buildDefaultName('M', '0x1234567890abcdef3456')).toBe('M - 3456')
  })
})
