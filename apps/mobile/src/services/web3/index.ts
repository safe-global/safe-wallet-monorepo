import { ethers, JsonRpcProvider } from 'ethers'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type Safe from '@safe-global/protocol-kit'
import { SafeInfo } from '@/src/types/address'
import { INFURA_TOKEN } from '@safe-global/utils/config/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'

export const createWeb3ReadOnly = (chain: Chain, customRpc?: string): JsonRpcProvider | undefined => {
  const url = customRpc || getRpcServiceUrl(chain.rpcUri)
  if (!url) {
    return
  }

  return new JsonRpcProvider(url, Number(chain.chainId), {
    staticNetwork: true,
    batchMaxCount: 3,
  })
}

// RPC helpers
const formatRpcServiceUrl = ({ authentication, value }: Chain['rpcUri'], token?: string): string => {
  const needsToken = authentication === 'API_KEY_PATH'

  if (needsToken && !token) {
    console.warn('Infura token not set in .env')
    return ''
  }

  return needsToken ? `${value}${token}` : value
}

export const getRpcServiceUrl = (rpcUri: Chain['rpcUri']): string => {
  return formatRpcServiceUrl(rpcUri, INFURA_TOKEN)
}

export const createConnectedWallet = async (
  privateKey: string,
  activeSafe: SafeInfo,
  chain: Chain,
): Promise<{
  wallet: ethers.Wallet
  protocolKit: Safe
}> => {
  const wallet = new ethers.Wallet(privateKey)
  const provider = createWeb3ReadOnly(chain)

  if (!provider) {
    throw new Error('Provider not found')
  }

  const readOnlySDK = getSafeSDK()
  if (!readOnlySDK) {
    throw new Error('Safe SDK is not initialized. Reopen the Safe account and try again.')
  }

  const [sdkAddress, sdkChainId] = await Promise.all([readOnlySDK.getAddress(), readOnlySDK.getChainId()])
  if (!sameAddress(sdkAddress, activeSafe.address) || sdkChainId.toString() !== activeSafe.chainId) {
    throw new Error(
      `Safe SDK is initialized for ${sdkChainId}:${sdkAddress}, not ${activeSafe.chainId}:${activeSafe.address}`,
    )
  }

  // connect() keeps the contract addresses resolved in initSafeSDK; a fresh Safe.init
  // would look them up in safe-deployments, which may not register this chain/version yet
  const protocolKit = await readOnlySDK.connect({
    provider: provider._getConnection().url,
    signer: privateKey,
    safeAddress: activeSafe.address,
  })

  return { wallet, protocolKit }
}

export const getUserNonce = async (chain: Chain, userAddress: string) => {
  const web3 = createWeb3ReadOnly(chain)

  if (!web3) {
    return -1
  }

  try {
    return await web3.getTransactionCount(userAddress, 'pending')
  } catch (error) {
    return Promise.reject(error)
  }
}
