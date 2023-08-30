import { RPC_AUTHENTICATION, type RpcUri } from '@safe-global/safe-gateway-typescript-sdk'
import { INFURA_TOKEN, SAFE_APPS_INFURA_TOKEN } from '@/config/constants'
import { type EIP1193Provider } from '@web3-onboard/core'
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import ExternalStore from '@/services/ExternalStore'
import { EMPTY_DATA } from '@safe-global/safe-core-sdk/dist/src/utils/constants'

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

export const createWeb3ReadOnly = (rpcUri: RpcUri, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || getRpcServiceUrl(rpcUri)
  if (!url) return
  return new JsonRpcProvider({ url, timeout: 10_000 })
}

export const createWeb3 = (walletProvider: EIP1193Provider): Web3Provider => {
  return new Web3Provider(walletProvider)
}

export const createSafeAppsWeb3Provider = (safeAppsRpcUri: RpcUri, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || formatRpcServiceUrl(safeAppsRpcUri, SAFE_APPS_INFURA_TOKEN)
  if (!url) return
  return new JsonRpcProvider({ url, timeout: 10_000 })
}

export const { setStore: setWeb3, useStore: useWeb3 } = new ExternalStore<Web3Provider>()

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

export const isSmartContract = async (provider: JsonRpcProvider, address: string): Promise<boolean> => {
  const code = await provider.getCode(address)

  return code !== EMPTY_DATA
}
