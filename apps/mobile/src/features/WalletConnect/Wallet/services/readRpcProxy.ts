import type { JsonRpcProvider } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { createWeb3ReadOnly, getRpcServiceUrl } from '@/src/services/web3'
import { READ_ONLY_RPC_ALLOW_LIST } from './constants'

const providerCache = new Map<string, JsonRpcProvider>()

const getProviderForChain = (chain: Chain): JsonRpcProvider => {
  const url = getRpcServiceUrl(chain.rpcUri)
  if (!url) {
    throw new Error(`No RPC URL configured for chainId=${chain.chainId}`)
  }
  // Key by url as well as chainId so a changed RPC endpoint isn't served by a stale provider.
  const cacheKey = `${chain.chainId}|${url}`
  const cached = providerCache.get(cacheKey)
  if (cached) {
    return cached
  }
  const provider = createWeb3ReadOnly(chain)
  if (!provider) {
    throw new Error(`No RPC URL configured for chainId=${chain.chainId}`)
  }
  providerCache.set(cacheKey, provider)
  return provider
}

export const isReadOnlyMethod = (method: string): boolean =>
  (READ_ONLY_RPC_ALLOW_LIST as readonly string[]).includes(method)

export const proxyReadOnlyCall = async (chain: Chain, method: string, params: unknown[]): Promise<unknown> => {
  if (!isReadOnlyMethod(method)) {
    throw new Error(`Method ${method} is not in the read-only allow-list`)
  }
  const provider = getProviderForChain(chain)
  return provider.send(method, params ?? [])
}
