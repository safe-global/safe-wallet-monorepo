import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { type RequiredTenderlySimulation } from '@/components/tx/security/tenderly/types'
import { SAFENET_API_URL } from '@/config/constants'
import type { SafeVersion } from '@safe-global/safe-core-sdk-types'

export type SafenetSafeEntity = {
  safe: string
  chainId: number
  guard: string
}

export type SafenetConfigEntity = {
  chains: number[]
  guards: Record<string, string>
  settlementEngines: Record<string, string>
  tokens: Record<string, Record<string, string>>
  processors: Record<string, string>
}

export type SafenetBalanceEntity = {
  [tokenSymbol: string]: string
}

export type SafenetSimulateTransactionRequest = {
  safe: string
  safeTxHash: string
}

export type SafenetSimulationResponse = RequiredTenderlySimulation

export type DeploySafenetAccountResponse = {
  safeAddress: string
  safeAccountConfig: {
    owners: string[]
    threshold: number
    to?: string
    data?: string
    fallbackHandler?: string
    paymentToken?: string
    payment?: number
    paymentReceiver?: string
  }
  saltNonce: string
  factoryAddress: string
  masterCopy: string
  safeVersion: SafeVersion
}

export const getSafenetBalances = async (safeAddress: string): Promise<SafenetBalanceEntity> => {
  const response = await fetch(`${SAFENET_API_URL}/api/v1/balances/${safeAddress}`)
  const data = await response.json()
  return data
}

export const safenetApi = createApi({
  reducerPath: 'safenetApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${SAFENET_API_URL}/api/v1` }),
  tagTypes: ['SafenetConfig', 'SafenetOffchainStatus', 'SafenetBalance', 'SafenetSimulation', 'DeploySafenetAccount'],
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
    simulateSafenetTransaction: builder.query<
      SafenetSimulationResponse,
      {
        chainId: string
        tx: SafenetSimulateTransactionRequest
      }
    >({
      query: ({ chainId, tx }) => ({
        url: `/tx/simulate/${chainId}`,
        method: 'POST',
        body: tx,
      }),
      providesTags: (_, __, arg) => [{ type: 'SafenetSimulation', id: arg.tx.safeTxHash }],
    }),
    deploySafenetAccount: builder.query<
      DeploySafenetAccountResponse,
      {
        account: {
          owners: string[]
          threshold: number
        }
        saltNonce: string
      }
    >({
      query: ({ account: { owners, threshold }, saltNonce }) => ({
        url: `/account/deploy`,
        method: 'POST',
        body: { account: { owners, threshold }, saltNonce },
      }),
      providesTags: ['DeploySafenetAccount'],
    }),
  }),
})

export const {
  useGetSafenetConfigQuery,
  useLazyGetSafenetBalanceQuery,
  useLazySimulateSafenetTransactionQuery,
  useLazyDeploySafenetAccountQuery,
} = safenetApi
