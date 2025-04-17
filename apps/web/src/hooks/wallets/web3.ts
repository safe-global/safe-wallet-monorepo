import { type ChainInfo, RPC_AUTHENTICATION, type RpcUri } from '@safe-global/safe-gateway-typescript-sdk'
import { JsonRpcProvider, BrowserProvider, type Eip1193Provider } from 'ethers'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { INFURA_TOKEN, SAFE_APPS_INFURA_TOKEN } from '@safe-global/utils/config/constants'

/**
 * Infura and other RPC providers limit the max amount included in a batch RPC call.
 * Ethers uses 100 by default which is too high for i.e. Infura.
 *
 * Some networks like Scroll only support a batch size of 3.
 */
const BATCH_MAX_COUNT = 3

// RPC helpers
const formatRpcServiceUrl = ({ authentication, value }: RpcUri, token: string): string => {
  const needsToken = authentication === RPC_AUTHENTICATION.API_KEY_PATH

  if (needsToken && !token) {
    console.warn('Infura token not set in .env')
    return ''
  }

  return needsToken ? `${value}${token}` : value
}

export const getRpcServiceUrl = (rpcUri: RpcUri): string => {
  return formatRpcServiceUrl(rpcUri, INFURA_TOKEN)
}

export const createWeb3ReadOnly = (chain: ChainInfo, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || getRpcServiceUrl(chain.rpcUri)
  if (!url) return
  return new JsonRpcProvider(url, Number(chain.chainId), {
    staticNetwork: true,
    batchMaxCount: BATCH_MAX_COUNT,
  })
}

export const createWeb3 = (walletProvider: Eip1193Provider): BrowserProvider => {
  return new BrowserProvider(walletProvider)
}

export const createSafeAppsWeb3Provider = (chain: ChainInfo, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || formatRpcServiceUrl(chain.rpcUri, SAFE_APPS_INFURA_TOKEN)
  if (!url) return
  return new JsonRpcProvider(url, undefined, {
    staticNetwork: true,
    batchMaxCount: BATCH_MAX_COUNT,
  })
}

export const { setStore: setWeb3, useStore: useWeb3 } = new ExternalStore<BrowserProvider>()

export const {
  getStore: getWeb3ReadOnly,
  setStore: setWeb3ReadOnly,
  useStore: useWeb3ReadOnly,
} = new ExternalStore<JsonRpcProvider>()

export const getUserNonce = async (userAddress: string): Promise<number> => {
  const web3 = getWeb3ReadOnly()
  if (!web3) return -1
  try {
    return await web3.getTransactionCount(userAddress, 'pending')
  } catch (error) {
    return Promise.reject(error)
  }
}
