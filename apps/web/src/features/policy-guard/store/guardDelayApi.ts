import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import type { RootState } from '@/store'
import { gatewayApi } from '@/store/api/gateway'
import { readWithChainProvider } from './readWithChainProvider'

// Loaded on first read: its RPC error helpers pull contract ABIs that the always-loaded hook must not
const loadReadGuardDelay = () =>
  import('../services/readGuardDelay').then(
    ({ readGuardDelay }) => readGuardDelay,
    (error) => {
      logError(ErrorCodes._658, error)
      throw error
    },
  )

export type GuardDelayArgs = { chainId: string; guardAddress: string; customRpc?: string }

export const guardDelayApi = gatewayApi.injectEndpoints({
  endpoints: (builder) => ({
    getGuardDelay: builder.query<number, GuardDelayArgs>({
      queryFn: ({ chainId, guardAddress, customRpc }, { getState }) =>
        readWithChainProvider(getState() as RootState, chainId, customRpc, async (provider) => {
          const readGuardDelay = await loadReadGuardDelay()
          return readGuardDelay(provider, guardAddress)
        }),
      // A guard's delay is immutable
      keepUnusedDataFor: 24 * 60 * 60,
    }),
  }),
})

export const { useGetGuardDelayQuery } = guardDelayApi
