import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import type { RootState } from '@/store'
import { gatewayApi } from '@/store/api/gateway'
import type { GuardSlots } from '../services/readGuardSlots'
import { readWithChainProvider } from './readWithChainProvider'

// Loaded on first read: its RPC error helpers pull contract ABIs that the always-loaded hook must not
const loadReadGuardSlots = () =>
  import('../services/readGuardSlots').then(
    ({ readGuardSlots }) => readGuardSlots,
    (error) => {
      logError(ErrorCodes._654, error)
      throw error
    },
  )

// txHistoryTag and customRpc are part of the key so a new transaction or RPC starts a fresh read
export type GuardSlotsArgs = { chainId: string; safeAddress: string; txHistoryTag: string; customRpc?: string }

export const guardSlotsApi = gatewayApi.injectEndpoints({
  endpoints: (builder) => ({
    getGuardSlots: builder.query<GuardSlots, GuardSlotsArgs>({
      queryFn: ({ chainId, safeAddress, customRpc }, { getState }) =>
        readWithChainProvider(getState() as RootState, chainId, customRpc, async (provider) => {
          const readGuardSlots = await loadReadGuardSlots()
          return readGuardSlots(provider, safeAddress)
        }),
    }),
  }),
})

export const { useGetGuardSlotsQuery } = guardSlotsApi
