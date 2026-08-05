import { convertChainIdToCoinType, ETH_COIN_TYPE, getEnsHubChainId } from './ens'

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
})
