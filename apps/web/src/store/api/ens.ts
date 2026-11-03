import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { getReadOnlyProvider } from '@/hooks/wallets/getReadOnlyProvider'
import { logResolverFailure } from '@/services/ens'
import type { RootState } from '@/store'
import { gatewayApi } from '@/store/api/gateway'

// Primary names rarely change, so a name is kept for an hour after its last reader is gone
const PRIMARY_NAME_CACHE_SECONDS = 60 * 60

// customRpc is part of the key so a new RPC for the hub starts a fresh lookup
export type EnsPrimaryNameArgs = { hubChainId: string; address: string; customRpc?: string }

export const ensApi = gatewayApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnsPrimaryName: builder.query<string | null, EnsPrimaryNameArgs>({
      async queryFn({ hubChainId, address, customRpc }, { getState }) {
        const state = getState() as RootState
        const chains = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state).data
        const hubChain = chains ? chainsAdapter.getSelectors().selectById(chains, hubChainId) : undefined
        if (!hubChain) return { error: new Error('ENS hub chain config not found') }

        try {
          const provider = await getReadOnlyProvider(hubChain, customRpc)
          if (!provider) return { error: new Error('No RPC is configured for the ENS hub') }
          // Primary names live on the hub with ETH coin type 60
          return { data: (await provider.lookupAddress(address, ETH_COIN_TYPE)) ?? null }
        } catch (error) {
          logResolverFailure(error)
          return { error: asError(error) }
        }
      },
      keepUnusedDataFor: PRIMARY_NAME_CACHE_SECONDS,
    }),
  }),
})

export const { useGetEnsPrimaryNameQuery } = ensApi
