import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { SAFENET_API_URL } from '@/config/constants'

export type SafenetSafeEntity = {
  safe: string
  chainId: number
  guard: string
}

export type SafenetConfigEntity = {
  chains: number[]
  guards: Record<string, string>
  tokens: Record<string, Record<string, string>>
  processors: Record<string, string>
}

export type SafenetBalanceEntity = {
  [tokenSymbol: string]: string
}

export type SafenetSimulateTx = {
  safe: string
  safeTxHash: string
  to: string
  value: string
  data: string
  operation: number
  safeTxGas: string
  baseGas: string
  gasPrice: string
  gasToken: string
  refundReceiver: string
  confirmations: []
  dataDecoded: unknown
}

export type SafenetSimulationResult = {
  guarantee: string
  status: 'success' | 'failure' | 'skipped' | 'pending'
  metadata?: {
    link?: string
  }
}

export type SafenetSimulationResponse = {
  hasError: boolean
  hasPending: boolean
  results: SafenetSimulationResult[]
}

export const getSafenetBalances = async (safeAddress: string): Promise<SafenetBalanceEntity> => {
  const response = await fetch(`${SAFENET_API_URL}/api/v1/balances/${safeAddress}`)
  const data = await response.json()
  return data
}

export const safenetApi = createApi({
  reducerPath: 'safenetApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${SAFENET_API_URL}/api/v1` }),
  tagTypes: ['SafenetConfig', 'SafenetOffchainStatus', 'SafenetBalance', 'SafenetSimulation'],
  endpoints: (builder) => ({
    getSafenetConfig: builder.query<SafenetConfigEntity, void>({
      query: () => ({
        url: '/about',
        responseHandler: async (response) => {
          return (await response.json()).config
        },
      }),
      providesTags: ['SafenetConfig'],
    }),
    getSafenetOffchainStatus: builder.query<SafenetSafeEntity, { chainId: string; safeAddress: string }>({
      query: ({ chainId, safeAddress }) => `/account/${chainId}/${safeAddress}`,
      providesTags: (_, __, arg) => [{ type: 'SafenetOffchainStatus', id: arg.safeAddress }],
    }),
    registerSafenet: builder.mutation<boolean, { chainId: string; safeAddress: string }>({
      query: ({ chainId, safeAddress }) => ({
        url: `/account`,
        method: 'POST',
        body: {
          chainId: Number(chainId),
          safe: safeAddress,
        },
      }),
      invalidatesTags: (_, __, arg) => [{ type: 'SafenetOffchainStatus', id: arg.safeAddress }],
    }),
    getSafenetBalance: builder.query<SafenetBalanceEntity, { safeAddress: string }>({
      query: ({ safeAddress }) => `/balances/${safeAddress}`,
      providesTags: (_, __, arg) => [{ type: 'SafenetBalance', id: arg.safeAddress }],
    }),
    simulateSafenetTx: builder.query<
      SafenetSimulationResponse,
      {
        chainId: string
        tx: SafenetSimulateTx
      }
    >({
      query: ({ chainId, tx }) => ({
        url: `/tx/simulate/${chainId}`,
        method: 'POST',
        body: tx,
      }),
      providesTags: (_, __, arg) => [{ type: 'SafenetSimulation', id: arg.tx.safeTxHash }],
    }),
  }),
})

export const { useGetSafenetConfigQuery, useLazyGetSafenetBalanceQuery, useLazySimulateSafenetTxQuery } = safenetApi
