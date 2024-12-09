import { type ChainInfo, RPC_AUTHENTICATION, type RpcUri } from '@safe-global/safe-gateway-typescript-sdk'
import { JsonRpcProvider, BrowserProvider, type Eip1193Provider, type Provider } from 'ethers'
import ExternalStore from '@/services/ExternalStore'
import { EMPTY_DATA } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { JSON_RPC_PROVIDER } from '@/features/superChain/constants'

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
  return JSON_RPC_PROVIDER!
}

export const createWeb3ReadOnly = (chain: ChainInfo, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || getRpcServiceUrl(chain.rpcUri)
  if (!url) return
  return new JsonRpcProvider(url, undefined, {
    staticNetwork: true,
  })
}

export const createWeb3 = (walletProvider: Eip1193Provider): BrowserProvider => {
  return new BrowserProvider(walletProvider)
}

export const createSafeAppsWeb3Provider = (chain: ChainInfo, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || JSON_RPC_PROVIDER!
  if (!url) return
  return new JsonRpcProvider(url, undefined, {
    staticNetwork: true,
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

export const isSmartContract = async (provider: Provider, address: string): Promise<boolean> => {
  const code = await provider.getCode(address)

  return code !== EMPTY_DATA
}
