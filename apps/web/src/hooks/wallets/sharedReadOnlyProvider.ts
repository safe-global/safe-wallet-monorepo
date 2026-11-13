import type { JsonRpcProvider } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { createWeb3ReadOnly } from './web3'

// One provider per chain RPC, shared by every consumer for the session. Idle JsonRpcProviders hold
// no timers or connections, so keeping them alive is cheaper than one provider per mounted hook.
const providers: Record<string, JsonRpcProvider> = {}

export const getSharedReadOnlyProvider = (chain: Chain, customRpc?: string): JsonRpcProvider | undefined => {
  const key = `${chain.chainId}:${customRpc ?? ''}`
  if (!providers[key]) {
    const provider = createWeb3ReadOnly(chain, customRpc)
    if (!provider) return undefined
    providers[key] = provider
  }
  return providers[key]
}

// Test-only: the module-level provider cache would otherwise leak mocks between tests
export const _clearSharedReadOnlyProviders = (): void => {
  Object.keys(providers).forEach((key) => delete providers[key])
}
