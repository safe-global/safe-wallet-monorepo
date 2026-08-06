import { convertChainIdToCoinType, ETH_COIN_TYPE, getEnsHubChainId, resolveNameForChain } from '../ens'

const ADDRESS = '0x0000000000000000000000000000000000000001'

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

    it('returns undefined for chain ids ENSIP-11 cannot represent', () => {
      expect(convertChainIdToCoinType(0x80000000)).toBeUndefined()
      expect(convertChainIdToCoinType(11297108109)).toBeUndefined() // Palm, > 2^32
      expect(convertChainIdToCoinType(0)).toBeUndefined()
      expect(convertChainIdToCoinType(-1)).toBeUndefined()
      expect(convertChainIdToCoinType(1.5)).toBeUndefined()
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

  describe('resolveNameForChain', () => {
    it('resolves with the chain-specific coin type', async () => {
      const resolveName = jest.fn().mockResolvedValue(ADDRESS)

      expect(await resolveNameForChain({ resolveName }, 'test.eth', 8453)).toBe(ADDRESS)
      expect(resolveName).toHaveBeenCalledTimes(1)
      expect(resolveName).toHaveBeenCalledWith('test.eth', (0x80000000 | 8453) >>> 0)
    })

    it('does not fall back to the ETH coin type when the chain-specific record is missing', async () => {
      const resolveName = jest.fn().mockResolvedValue(null)

      expect(await resolveNameForChain({ resolveName }, 'test.eth', 8453)).toBeNull()
      expect(resolveName).toHaveBeenCalledTimes(1)
      expect(resolveName).toHaveBeenCalledWith('test.eth', (0x80000000 | 8453) >>> 0)
    })

    it('resolves mainnet with the ETH coin type', async () => {
      const resolveName = jest.fn().mockResolvedValue(ADDRESS)

      expect(await resolveNameForChain({ resolveName }, 'test.eth', 1)).toBe(ADDRESS)
      expect(resolveName).toHaveBeenCalledTimes(1)
      expect(resolveName).toHaveBeenCalledWith('test.eth', ETH_COIN_TYPE)
    })

    it('returns null for chain ids without an ENSIP-11 coin type', async () => {
      const resolveName = jest.fn().mockResolvedValue(ADDRESS)

      expect(await resolveNameForChain({ resolveName }, 'test.eth', 11297108109)).toBeNull()
      expect(resolveName).not.toHaveBeenCalled()
    })
  })
})
