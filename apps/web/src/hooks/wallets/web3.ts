import { type Chain, type RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { JsonRpcProvider, BrowserProvider, Network, type Eip1193Provider, type Networkish } from 'ethers'
import { INFURA_TOKEN, SAFE_APPS_INFURA_TOKEN } from '@safe-global/utils/config/constants'

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

/**
 * ENS UniversalResolver overrides, by chain id.
 *
 * ENSv2 is live on Sepolia (2026): names registered or renewed there resolve
 * only through the new UniversalResolver, while the resolver address baked
 * into our ethers version still points at the pre-v2 proxy — which reverts
 * `ResolverNotFound` for exactly those names (this is what broke the e2e ENS
 * fixtures on 2026-07-31). Mainnet needs no entry: its resolver is a DAO-owned
 * proxy upgraded in place.
 *
 * Address source: ensdomains/ens-contracts `deployments/sepolia/UniversalResolver.json`.
 */
const ENS_UNIVERSAL_RESOLVER_OVERRIDES: Record<string, string> = {
  '11155111': '0x3c85752a5d47DD09D677C645Ff2A938B38fbFEbA',
}

/** The ENS registry lives at the same address on every ENS-enabled chain. */
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

/**
 * The network for a provider: plain chain id, unless the chain needs an ENS
 * UniversalResolver override — those get an explicit Network carrying it.
 */
const networkFor = (chain: Chain): Networkish => {
  const ensUniversalResolver = ENS_UNIVERSAL_RESOLVER_OVERRIDES[chain.chainId]
  const chainId = Number(chain.chainId)
  if (!ensUniversalResolver) return chainId
  return Network.from({
    name: chain.shortName,
    chainId,
    ensAddress: ENS_REGISTRY_ADDRESS,
    ensNetwork: chainId,
    ensUniversalResolver,
  })
}

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

export const createWeb3ReadOnly = (chain: Chain, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || getRpcServiceUrl(chain.rpcUri)
  if (!url) return
  return new JsonRpcProvider(url, networkFor(chain), {
    staticNetwork: true,
    batchMaxCount: BATCH_MAX_COUNT,
  })
}

export const createWeb3 = (walletProvider: Eip1193Provider): BrowserProvider => {
  return new BrowserProvider(walletProvider)
}

export const createSafeAppsWeb3Provider = (chain: Chain, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || formatRpcServiceUrl(chain.rpcUri, SAFE_APPS_INFURA_TOKEN)
  if (!url) return
  return new JsonRpcProvider(url, undefined, {
    staticNetwork: true,
    batchMaxCount: BATCH_MAX_COUNT,
  })
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
