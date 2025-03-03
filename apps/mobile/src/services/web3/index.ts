import { ethers, JsonRpcProvider } from 'ethers'
import { ChainInfo, RPC_AUTHENTICATION, RpcUri } from '@safe-global/safe-gateway-typescript-sdk'
import Safe from '@safe-global/protocol-kit'
import { SafeInfo } from '@/src/types/address'

export const createWeb3ReadOnly = (chain: ChainInfo, customRpc?: string): JsonRpcProvider | undefined => {
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
const formatRpcServiceUrl = ({ authentication, value }: RpcUri, token?: string): string => {
  const needsToken = authentication === RPC_AUTHENTICATION.API_KEY_PATH

  if (needsToken && !token) {
    console.warn('Infura token not set in .env')
    return ''
  }

  return needsToken ? `${value}${token}` : value
}

export const getRpcServiceUrl = (rpcUri: RpcUri): string => {
  return formatRpcServiceUrl(rpcUri, process.env.EXPO_PUBLIC_INFURA_TOKEN)
}

export const createConnectedWallet = async (
  privateKey: string,
  activeSafe: SafeInfo,
  chain: ChainInfo,
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
