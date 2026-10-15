import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import type { RootState } from '@/store'
import { gatewayApi } from '@/store/api/gateway'
import { selectRpc } from '@/store/settingsSlice'
import { getReadOnlyProvider } from '../services/getReadOnlyProvider'
import { readModuleGuard } from '../services/readModuleGuard'

// txHistoryTag is part of the key so a new transaction starts a fresh read
export type ModuleGuardArgs = { chainId: string; safeAddress: string; txHistoryTag: string }

export const moduleGuardApi = gatewayApi.injectEndpoints({
  endpoints: (builder) => ({
    getModuleGuard: builder.query<string, ModuleGuardArgs>({
      async queryFn({ chainId, safeAddress }, { getState }) {
        const state = getState() as RootState
        const chains = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state).data
        const chain = chains ? chainsAdapter.getSelectors().selectById(chains, chainId) : undefined
        if (!chain) return { error: new Error('Chain config not found') }

        try {
          const provider = await getReadOnlyProvider(chain, selectRpc(state)[chainId])
          if (!provider) return { error: new Error('No RPC is configured for this chain') }
          return { data: await readModuleGuard(provider, safeAddress) }
        } catch (error) {
          return { error: asError(error) }
        }
      },
    }),
  }),
})

export const { useGetModuleGuardQuery } = moduleGuardApi
