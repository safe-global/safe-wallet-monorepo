import { ethers, JsonRpcProvider } from 'ethers'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import Safe from '@safe-global/protocol-kit'
import { SafeInfo } from '@/src/types/address'
import { INFURA_TOKEN } from '@safe-global/utils/config/constants'

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

  const RPC_URL = provider._getConnection().url

  let protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: privateKey,
    safeAddress: activeSafe.address,
  })

  protocolKit = await protocolKit.connect({
    provider: RPC_URL,
    signer: privateKey,
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
