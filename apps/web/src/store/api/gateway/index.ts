import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

import { asError } from '@safe-global/utils/services/exceptions/utils'
import { safeOverviewEndpoints } from './safeOverviews'

async function _buildQueryFn<T>(fn: () => Promise<T>) {
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
    ...safeOverviewEndpoints(builder),
  }),
})

export const { useGetSafeOverviewQuery, useGetMultipleSafeOverviewsQuery } = gatewayApi
