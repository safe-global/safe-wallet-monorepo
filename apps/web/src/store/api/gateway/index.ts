import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

import { asError } from '@safe-global/utils/services/exceptions/utils'
import { safeOverviewEndpoints } from './safeOverviews'
import { gtfFeePreviewEndpoints } from './gtfFeePreview'

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

// Cache-tag id for the SafeOverviews tag. Lowercased so the id built from a CGW
// response (checksummed) matches the one built from a TxEvent payload.
export const makeSafeOverviewTag = (chainId: string, address: string): string => `${chainId}:${address.toLowerCase()}`

export const gatewayApi = createApi({
  reducerPath: 'gatewayApi',
  baseQuery: fakeBaseQuery<Error>(),
  tagTypes: ['Submissions', 'SafeOverviews'],
  endpoints: (builder) => ({
    ...safeOverviewEndpoints(builder),
    ...gtfFeePreviewEndpoints(builder),
  }),
})

export const { useGetSafeOverviewQuery, useGetMultipleSafeOverviewsQuery, useGetGtfFeePreviewQuery } = gatewayApi
