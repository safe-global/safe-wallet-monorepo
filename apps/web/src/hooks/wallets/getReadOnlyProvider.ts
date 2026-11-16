import type { JsonRpcProvider } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getSharedReadOnlyProvider } from '@/hooks/wallets/sharedReadOnlyProvider'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'

export const getReadOnlyProvider = async (chain: Chain, customRpc?: string): Promise<JsonRpcProvider | undefined> => {
  const current = getWeb3ReadOnly()
  if (current && (await current.getNetwork()).chainId === BigInt(chain.chainId)) return current
  return getSharedReadOnlyProvider(chain, customRpc)
}
