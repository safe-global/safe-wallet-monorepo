import { getRpcServiceUrl } from '@/src/features/PendingTx/utils'
import { JsonRpcProvider } from 'ethers'
import { ChainInfo, RPC_AUTHENTICATION, RpcUri } from '@safe-global/safe-gateway-typescript-sdk'

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
  return formatRpcServiceUrl(rpcUri, process.env.INFURA_TOKEN)
}
