import type { JsonRpcProvider } from 'ethers'
import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import type { RootState } from '@/store'
import { getReadOnlyProvider } from '../services/getReadOnlyProvider'

/** Runs `read` against a read-only provider of `chainId`, shaped as an RTK Query `queryFn` result */
export const readWithChainProvider = async <T>(
  state: RootState,
  chainId: string,
  customRpc: string | undefined,
  read: (provider: JsonRpcProvider) => Promise<T>,
): Promise<{ data: T } | { error: Error }> => {
  const chains = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state).data
  const chain = chains ? chainsAdapter.getSelectors().selectById(chains, chainId) : undefined
  if (!chain) return { error: new Error('Chain config not found') }

  try {
    const provider = await getReadOnlyProvider(chain, customRpc)
    if (!provider) return { error: new Error('No RPC is configured for this chain') }
    return { data: await read(provider) }
  } catch (error) {
    return { error: asError(error) }
  }
}
