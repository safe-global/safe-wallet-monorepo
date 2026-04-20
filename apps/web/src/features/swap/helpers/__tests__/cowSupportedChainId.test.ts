import { SupportedChainId } from '@cowprotocol/cow-sdk'
import { parseCowSupportedChainId } from '../cowSupportedChainId'

describe('parseCowSupportedChainId', () => {
  it('returns the matching enum value for a CoW-supported chain id string', () => {
    expect(parseCowSupportedChainId('1')).toBe(SupportedChainId.MAINNET)
    expect(parseCowSupportedChainId('100')).toBe(SupportedChainId.GNOSIS_CHAIN)
    expect(parseCowSupportedChainId('42161')).toBe(SupportedChainId.ARBITRUM_ONE)
  })

  it('falls back to mainnet for unsupported or invalid ids', () => {
    expect(parseCowSupportedChainId('10')).toBe(SupportedChainId.MAINNET)
    expect(parseCowSupportedChainId('999999')).toBe(SupportedChainId.MAINNET)
    expect(parseCowSupportedChainId('')).toBe(SupportedChainId.MAINNET)
    expect(parseCowSupportedChainId('abc')).toBe(SupportedChainId.MAINNET)
  })
})
