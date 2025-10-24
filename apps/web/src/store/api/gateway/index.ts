import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

import { asError } from '@safe-global/utils/services/exceptions/utils'
import { safeOverviewEndpoints } from './safeOverviews'
import { createSubmission, getSubmission } from '@safe-global/safe-client-gateway-sdk'

export async function buildQueryFn<T>(fn: () => Promise<T>) {
  try {
    return { data: await fn() }
  } catch (error) {
    return { error: asError(error) }
  }
}

export function makeSafeTag(chainId: string, address: string): `${number}:0x${string}` {
  return `${chainId}:${address}` as `${number}:0x${string}`
}

export const gatewayApi = createApi({
  reducerPath: 'gatewayApi',
  baseQuery: fakeBaseQuery<Error>(),
  tagTypes: ['Submissions'],
  endpoints: (builder) => ({
    getSubmission: builder.query<
      getSubmission,
      { outreachId: number; chainId: string; safeAddress: string; signerAddress: string }
    >({
      queryFn({ outreachId, chainId, safeAddress, signerAddress }) {
        return buildQueryFn(() =>
          getSubmission({ params: { path: { outreachId, chainId, safeAddress, signerAddress } } }),
        )
      },
      providesTags: ['Submissions'],
    }),
    createSubmission: builder.mutation<
      createSubmission,
      { outreachId: number; chainId: string; safeAddress: string; signerAddress: string }
    >({
      queryFn({ outreachId, chainId, safeAddress, signerAddress }) {
        return buildQueryFn(() =>
          createSubmission({
            params: {
              path: { outreachId, chainId, safeAddress, signerAddress },
            },
            body: { completed: true },
          }),
        )
      },
      invalidatesTags: ['Submissions'],
    }),
    ...safeOverviewEndpoints(builder),
  }),
})

export const {
  useGetSubmissionQuery,
  useCreateSubmissionMutation,
  useGetSafeOverviewQuery,
  useGetMultipleSafeOverviewsQuery,
} = gatewayApi
