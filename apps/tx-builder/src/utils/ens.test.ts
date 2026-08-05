import { convertChainIdToCoinType, ETH_COIN_TYPE, getEnsHubChainId, resolveNameForChain } from './ens'

const ADDRESS = '0x0000000000000000000000000000000000000001'

describe('ens utils', () => {
  it('maps mainnet to coin type 60', () => {
    expect(convertChainIdToCoinType(1)).toBe(ETH_COIN_TYPE)
  })

  it('maps other EVM chains with ENSIP-11', () => {
    expect(convertChainIdToCoinType(8453)).toBe((0x80000000 | 8453) >>> 0)
  })

  it('selects mainnet vs Sepolia hubs', () => {
    expect(getEnsHubChainId(false)).toBe('1')
    expect(getEnsHubChainId(true)).toBe('11155111')
  })

  describe('resolveNameForChain', () => {
    it('resolves with the chain-specific coin type', async () => {
      const resolveName = jest.fn().mockResolvedValue(ADDRESS)

      expect(await resolveNameForChain({ resolveName }, 'test.eth', 8453)).toBe(ADDRESS)
      expect(resolveName).toHaveBeenCalledTimes(1)
      expect(resolveName).toHaveBeenCalledWith('test.eth', (0x80000000 | 8453) >>> 0)
    })

    it('falls back to the ETH coin type when the chain-specific record is missing', async () => {
      const resolveName = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(ADDRESS)

      expect(await resolveNameForChain({ resolveName }, 'test.eth', 8453)).toBe(ADDRESS)
      expect(resolveName).toHaveBeenNthCalledWith(1, 'test.eth', (0x80000000 | 8453) >>> 0)
      expect(resolveName).toHaveBeenNthCalledWith(2, 'test.eth', ETH_COIN_TYPE)
    })

    it('does not fall back when resolving for mainnet', async () => {
      const resolveName = jest.fn().mockResolvedValue(null)

      expect(await resolveNameForChain({ resolveName }, 'test.eth', 1)).toBeNull()
      expect(resolveName).toHaveBeenCalledTimes(1)
      expect(resolveName).toHaveBeenCalledWith('test.eth', ETH_COIN_TYPE)
    })
  })
})
