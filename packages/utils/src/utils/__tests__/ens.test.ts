import { convertChainIdToCoinType, ETH_COIN_TYPE, getEnsHubChainId } from '../ens'

describe('ens utils', () => {
  describe('convertChainIdToCoinType', () => {
    it('returns SLIP-44 coin type 60 for Ethereum mainnet', () => {
      expect(convertChainIdToCoinType(1)).toBe(ETH_COIN_TYPE)
    })

    it('returns ENSIP-11 coin types for other EVM chains', () => {
      expect(convertChainIdToCoinType(8453)).toBe((0x80000000 | 8453) >>> 0)
      expect(convertChainIdToCoinType(10)).toBe((0x80000000 | 10) >>> 0)
      expect(convertChainIdToCoinType(11155111)).toBe((0x80000000 | 11155111) >>> 0)
    })
  })

  describe('getEnsHubChainId', () => {
    it('returns mainnet for production chains', () => {
      expect(getEnsHubChainId(false)).toBe('1')
    })

    it('returns Sepolia for testnets', () => {
      expect(getEnsHubChainId(true)).toBe('11155111')
    })
  })
})
