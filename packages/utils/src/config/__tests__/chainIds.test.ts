import { getChainIdFromEip3770NetworkPrefix } from '@safe-global/protocol-kit'
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, ZKSYNC_ERA_CHAIN_ID } from '../chainIds'

describe('chainIds', () => {
  it.each([
    ['eth', MAINNET_CHAIN_ID],
    ['sep', SEPOLIA_CHAIN_ID],
    ['zksync', ZKSYNC_ERA_CHAIN_ID],
  ])('matches the EIP-3770 chain ID for %s', (shortName, chainId) => {
    expect(getChainIdFromEip3770NetworkPrefix(shortName).toString()).toBe(chainId)
  })
})
