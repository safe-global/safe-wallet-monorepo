import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import type { RootState } from '@/store'
import { gatewayApi } from '@/store/api/gateway'
import { readWithChainProvider } from './readWithChainProvider'

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
      queryFn: ({ chainId, safeAddress, customRpc }, { getState }) =>
        readWithChainProvider(getState() as RootState, chainId, customRpc, async (provider) => {
          const readModuleGuard = await loadReadModuleGuard()
          return readModuleGuard(provider, safeAddress)
        }),
    }),
  }),
})

export const { useGetModuleGuardQuery } = moduleGuardApi
