import { type Chain, type RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { JsonRpcProvider, BrowserProvider, type Eip1193Provider } from 'ethers'
import { INFURA_TOKEN, SAFE_APPS_INFURA_TOKEN } from '@safe-global/utils/config/constants'
import type { RpcEndpointKind } from '@/services/observability/types'

// Re-export stores from lightweight module for backwards compatibility
export { setWeb3, useWeb3, getWeb3ReadOnly, setWeb3ReadOnly, useWeb3ReadOnly } from './web3ReadOnly'
import { getWeb3ReadOnly } from './web3ReadOnly'

/**
 * Infura and other RPC providers limit the max amount included in a batch RPC call.
 * Ethers uses 100 by default which is too high for i.e. Infura.
 *
 * Some networks like Scroll only support a batch size of 3.
 */
const BATCH_MAX_COUNT = 3

// RPC helpers
const formatRpcServiceUrl = ({ authentication, value }: RpcUri, token: string): string => {
  const needsToken = authentication === 'API_KEY_PATH'

  if (needsToken && !token) {
    console.warn('Infura token not set in .env')
    return ''
  }

  return needsToken ? `${value}${token}` : value
}

export const getRpcServiceUrl = (rpcUri: RpcUri): string => {
  return formatRpcServiceUrl(rpcUri, INFURA_TOKEN)
}

export interface RpcEndpointInfo {
  /** Host only (no token/path), safe to send to analytics. */
  rpcHost?: string
  rpcEndpointKind: RpcEndpointKind
}

/** Hostname of an RPC URL, or `undefined` if it can't be parsed. Never includes
 * the token — the Infura token lives in the path, not the host. */
const getRpcHost = (url: string): string | undefined => {
  try {
    return new URL(url).host
  } catch {
    return undefined
  }
}

/**
 * Classify a read-only RPC endpoint so errors can be attributed to our Infura
 * key vs. a chain-default public RPC vs. a user-set custom RPC. Pure fn.
 */
export const getRpcEndpointInfo = (
  rpcUri: RpcUri,
  { url, isCustom }: { url: string; isCustom: boolean },
): RpcEndpointInfo => {
  const rpcEndpointKind: RpcEndpointKind = isCustom
    ? 'custom'
    : rpcUri.authentication === 'API_KEY_PATH'
      ? 'infura'
      : 'chain_default'
  return { rpcHost: getRpcHost(url), rpcEndpointKind }
}

/** Non-enumerable so it never shows up in spreads, JSON, or logs — it's metadata,
 * not part of the provider's public shape. */
const RPC_ENDPOINT_INFO = Symbol('rpcEndpointInfo')

const stampRpcEndpointInfo = <T extends object>(provider: T, info: RpcEndpointInfo): T => {
  Object.defineProperty(provider, RPC_ENDPOINT_INFO, { value: info, enumerable: false })
  return provider
}

/** Read the endpoint metadata stamped onto a provider at creation, for use as
 * `ErrorContext` at a distant catch site. Returns `undefined` for an unstamped
 * or missing provider. */
export const getProviderRpcEndpointInfo = (provider?: object | null): RpcEndpointInfo | undefined =>
  provider ? (provider as Record<symbol, RpcEndpointInfo | undefined>)[RPC_ENDPOINT_INFO] : undefined

export const createWeb3ReadOnly = (chain: Chain, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || getRpcServiceUrl(chain.rpcUri)
  if (!url) return
  const provider = new JsonRpcProvider(url, Number(chain.chainId), {
    staticNetwork: true,
    batchMaxCount: BATCH_MAX_COUNT,
  })
  return stampRpcEndpointInfo(provider, getRpcEndpointInfo(chain.rpcUri, { url, isCustom: Boolean(customRpc) }))
}

export const createWeb3 = (walletProvider: Eip1193Provider): BrowserProvider => {
  return stampRpcEndpointInfo(new BrowserProvider(walletProvider), { rpcEndpointKind: 'wallet' })
}

export const createSafeAppsWeb3Provider = (chain: Chain, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || formatRpcServiceUrl(chain.rpcUri, SAFE_APPS_INFURA_TOKEN)
  if (!url) return
  const provider = new JsonRpcProvider(url, undefined, {
    staticNetwork: true,
    batchMaxCount: BATCH_MAX_COUNT,
  })
  return stampRpcEndpointInfo(provider, getRpcEndpointInfo(chain.rpcUri, { url, isCustom: Boolean(customRpc) }))
}

export const getUserNonce = async (userAddress: string): Promise<number> => {
  const web3 = getWeb3ReadOnly()
  if (!web3) return -1
  try {
    return await web3.getTransactionCount(userAddress, 'pending')
  } catch (error) {
    return Promise.reject(error)
  }
}
