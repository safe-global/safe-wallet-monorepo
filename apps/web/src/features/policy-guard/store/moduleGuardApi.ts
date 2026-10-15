import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { logError } from '@/services/exceptions'
import type { RootState } from '@/store'
import { gatewayApi } from '@/store/api/gateway'
import { getReadOnlyProvider } from '../services/getReadOnlyProvider'

// Loaded on first read: its RPC error helpers pull contract ABIs that the always-loaded hook must not
const loadReadModuleGuard = () =>
  import('../services/readModuleGuard').then(
    ({ readModuleGuard }) => readModuleGuard,
    (error) => {
      logError(ErrorCodes._654, error)
      throw error
    },
  )

// txHistoryTag and customRpc are part of the key so a new transaction or RPC starts a fresh read
export type ModuleGuardArgs = { chainId: string; safeAddress: string; txHistoryTag: string; customRpc?: string }

export const moduleGuardApi = gatewayApi.injectEndpoints({
  endpoints: (builder) => ({
    getModuleGuard: builder.query<string, ModuleGuardArgs>({
      async queryFn({ chainId, safeAddress, customRpc }, { getState }) {
        const state = getState() as RootState
        const chains = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state).data
        const chain = chains ? chainsAdapter.getSelectors().selectById(chains, chainId) : undefined
        if (!chain) return { error: new Error('Chain config not found') }

        try {
          const provider = await getReadOnlyProvider(chain, customRpc)
          if (!provider) return { error: new Error('No RPC is configured for this chain') }
          const readModuleGuard = await loadReadModuleGuard()
          return { data: await readModuleGuard(provider, safeAddress) }
        } catch (error) {
          return { error: asError(error) }
        }
      },
    }),
  }),
})

export const { useGetModuleGuardQuery } = moduleGuardApi
