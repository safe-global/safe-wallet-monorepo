import { getChainIdFromEip3770NetworkPrefix } from '@safe-global/protocol-kit'

/**
 * A shortName<->chainId dictionary backed by the EIP-3770 lookup from @safe-global/protocol-kit.
 * E.g.:
 *
 * chains.eth  // '1'
 * chains.gor  // '5'
 */
const chains: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_, shortName: string | symbol) {
    if (typeof shortName !== 'string') return undefined
    try {
      return getChainIdFromEip3770NetworkPrefix(shortName).toString()
    } catch {
      return undefined
    }
  },
})

export const ZKSYNC_ERA_CHAIN_ID = '324'

export default chains
