import type { JsonRpcProvider } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { logError } from '@/services/exceptions'

export const getReadOnlyProvider = async (chain: Chain, customRpc?: string): Promise<JsonRpcProvider | undefined> => {
  const current = getWeb3ReadOnly()
  if (current && (await current.getNetwork()).chainId === BigInt(chain.chainId)) return current

  // Dynamic import keeps ethers out of the main bundle
  const { getSharedReadOnlyProvider } = await import('@/hooks/wallets/sharedReadOnlyProvider').catch((error) => {
    logError(ErrorCodes._654, error)
    throw error
  })
  return getSharedReadOnlyProvider(chain, customRpc)
}
