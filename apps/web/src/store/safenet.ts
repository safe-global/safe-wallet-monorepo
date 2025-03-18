import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { type RequiredTenderlySimulation } from '@/components/tx/security/tenderly/types'
import { SAFENET_API_URL } from '@/config/constants'
import type { SafeVersion } from '@safe-global/safe-core-sdk-types'

export type SafenetConfigEntity = {
  chains: number[]
  guards: Record<string, string>
  settlementEngines: Record<string, string>
  tokens: Record<string, Record<string, string>>
  processors: Record<string, string>
}

export type SafenetAccountEntity = {
  guarantees: {
    guarantee: string
    inactiveAfter: string
    activeAfter: string
  }[]
  handle: string
  safes: {
    address: string
    chainId: number
    guard: string
  }[]
}

export type SafenetBalanceEntity = {
  [tokenSymbol: string]: {
    breakdown: {
      [chainId: string]: {
        address: string
        allowances: string
        balance: string
        pendingSettlements: string
        total: string
      }
    }
    total: string
  }
}

export type SafenetSimulateTransactionRequest = {
  safe: string
  safeTxHash: string
}

export type SafenetSimulationResponse = RequiredTenderlySimulation

export type SafenetDebit = {
  status: 'PENDING' | 'READY' | 'INITIATED' | 'CHALLENGED' | 'EXECUTED' | 'FAILED'
  token: string
  amount: string
  chainId: number
  feeBeneficiary: string
  feeAmount: string
  safe: string
  initTxHash?: string
  initAt?: string
  executionTxHash?: string
  executedAt?: string
}

export type SafenetSpend = {
  token: string
  amount: string
}

export type SafenetTransactionDetails = {
  status: 'SUBMITTED' | 'EXECUTED' | 'FAILED'
  fulfillmentTxHash?: string
  fulfilledAt?: string
  debits: SafenetDebit[]
  spends: SafenetSpend[]
  safe: string
  chainId: number
  safeTxHash: string
}
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
  tagTypes: ['SafenetConfig', 'SafenetAccount', 'SafenetBalance', 'SafenetSimulation', 'DeploySafenetAccount'],
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
    getSafenetAccount: builder.query<SafenetAccountEntity, { safeAddress: string }>({
      query: ({ safeAddress }) => `/account/${safeAddress}`,
      providesTags: (_, __, arg) => [{ type: 'SafenetAccount', id: arg.safeAddress }],
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
    getSafenetTransactionDetails: builder.query<SafenetTransactionDetails, { chainId: string; safeTxHash: string }>({
      query: ({ chainId, safeTxHash }) => ({
        url: `/tx/details/${chainId}/${safeTxHash}`,
        method: 'GET',
      }),
    }),
    getSafenetTransactionDetailsBySettlement: builder.query<
      SafenetTransactionDetails,
      { chainId: string; settlementTxHash: string }
    >({
      query: ({ chainId, settlementTxHash }) => ({
        url: `/tx/settlement/${chainId}/${settlementTxHash}/details`,
        method: 'GET',
      }),
    }),
    deploySafenetAccount: builder.query<
      DeploySafenetAccountResponse,
      {
        account: {
          owners: string[]
          threshold: number
        }
        saltNonce: string
        dryRun?: boolean
      }
    >({
      query: ({ account: { owners, threshold }, saltNonce, dryRun }) => {
        const url = `/account/deploy${dryRun ? `?dryRun=true` : ''}`
        return {
          url,
          method: 'POST',
          body: { account: { owners, threshold }, saltNonce },
        }
      },
    }),
  }),
})

export const {
  useGetSafenetConfigQuery,
  useLazyGetSafenetBalanceQuery,
  useGetSafenetBalanceQuery,
  useLazySimulateSafenetTransactionQuery,
  useGetSafenetTransactionDetailsQuery,
  useGetSafenetTransactionDetailsBySettlementQuery,
  useGetSafenetAccountQuery,
  useLazyDeploySafenetAccountQuery,
  useDeploySafenetAccountQuery,
} = safenetApi
