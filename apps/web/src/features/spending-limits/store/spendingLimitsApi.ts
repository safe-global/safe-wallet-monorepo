import type { JsonRpcProvider } from 'ethers'
import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import type { NativeToken } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { Errors, logError } from '@/services/exceptions'
import type { RootState } from '@/store'
import { gatewayApi } from '@/store/api/gateway'
import { getReadOnlyProvider } from '@/hooks/wallets/getReadOnlyProvider'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { makeSpendingLimitsTag } from '@/store/api/gateway/tagTypes'
import type { SpendingLimitState } from '../public/types'

export type SpendingLimitsArgs = {
  chainId: string
  safeAddress: string
  moduleAddresses: string[]
  customRpc?: string
}

/** The read args for a Safe; a custom RPC set for its chain is part of them. */
export const toSpendingLimitsArgs = (
  safe: ExtendedSafeInfo,
  customRpcs: Record<string, string | undefined>,
): SpendingLimitsArgs => ({
  chainId: safe.chainId,
  safeAddress: safe.address.value,
  moduleAddresses: safe.modules?.map((module) => module.value) ?? [],
  customRpc: customRpcs[safe.chainId],
})

const toNativeTokenInfo = ({ nativeCurrency }: Chain): NativeToken => ({
  ...nativeCurrency,
  address: ZERO_ADDRESS,
  type: 'NATIVE_TOKEN',
})

// A dynamic import keeps the AllowanceModule ABI and deployments out of the main bundle
const readSpendingLimits = async (
  provider: JsonRpcProvider,
  chain: Chain,
  { safeAddress, moduleAddresses }: SpendingLimitsArgs,
): Promise<SpendingLimitState[]> => {
  const { loadSpendingLimits } = await import('../services/spendingLimitLoader')
  const modules = moduleAddresses.map((value) => ({ value }))
  const spendingLimits = await loadSpendingLimits(
    provider,
    modules,
    safeAddress,
    chain.chainId,
    toNativeTokenInfo(chain),
  )
  return spendingLimits ?? []
}

const selectChain = (state: RootState, chainId: string): Chain | undefined => {
  const chains = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state).data
  return chains ? chainsAdapter.getSelectors().selectById(chains, chainId) : undefined
}

export const spendingLimitsApi = gatewayApi.injectEndpoints({
  endpoints: (builder) => ({
    getSpendingLimits: builder.query<SpendingLimitState[], SpendingLimitsArgs>({
      async queryFn(args, { getState }) {
        if (args.moduleAddresses.length === 0) return { data: [] }

        let provider: JsonRpcProvider | undefined
        try {
          const chain = selectChain(getState() as RootState, args.chainId)
          if (!chain) throw new Error(`Chain config not found for chain ${args.chainId}`)
          provider = await getReadOnlyProvider(chain, args.customRpc)
          if (!provider) throw new Error(`No RPC is configured for chain ${args.chainId}`)
          return { data: await readSpendingLimits(provider, chain, args) }
        } catch (error) {
          logError(Errors._609, error, getRpcErrorContext(provider))
          return { error: asError(error) }
        }
      },
      providesTags: (_result, _error, { chainId, safeAddress }) => [
        { type: 'SpendingLimits', id: makeSpendingLimitsTag(chainId, safeAddress) },
      ],
    }),
  }),
})

export const { useGetSpendingLimitsQuery } = spendingLimitsApi
