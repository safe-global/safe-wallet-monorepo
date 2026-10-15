import type { RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { INFURA_TOKEN } from '@safe-global/utils/config/constants'

// Kept free of ethers so main-bundle code can check for an RPC URL without loading web3.ts
export const formatRpcServiceUrl = ({ authentication, value }: RpcUri, token: string): string => {
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
