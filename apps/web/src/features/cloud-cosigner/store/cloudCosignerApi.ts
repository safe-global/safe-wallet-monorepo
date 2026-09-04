import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CLOUD_COSIGNER_URL } from '../constants'
import type {
  CloudCosignerInfo,
  CloudCosignerPolicy,
  CloudCosignerReview,
  SafeCloudCosignerStatus,
  UpdateCloudCosignerPolicyRequest,
} from '../types'

const TAG_TYPES = ['cloud-cosigner-status'] as const

/**
 * The cloud cosigner runs as its own deployable of the Client Gateway with its own base URL,
 * so it gets its own API slice rather than an injection into `cgwClient`.
 */
export const cloudCosignerApi = createApi({
  reducerPath: 'cloudCosignerApi',
  baseQuery: fetchBaseQuery({ baseUrl: CLOUD_COSIGNER_URL }),
  tagTypes: TAG_TYPES,
  endpoints: (build) => ({
    getCloudCosignerInfo: build.query<CloudCosignerInfo, void>({
      query: () => '/v1/cloud-cosigner',
    }),
    getSafeCloudCosignerStatus: build.query<SafeCloudCosignerStatus, { chainId: string; safeAddress: string }>({
      query: ({ chainId, safeAddress }) => `/v1/chains/${chainId}/safes/${safeAddress}/cloud-cosigner`,
      providesTags: (_result, _error, { chainId, safeAddress }) => [
        { type: 'cloud-cosigner-status', id: `${chainId}:${safeAddress}` },
      ],
    }),
    updateCloudCosignerPolicy: build.mutation<CloudCosignerPolicy, UpdateCloudCosignerPolicyRequest>({
      query: ({ chainId, safeAddress, ...body }) => ({
        url: `/v1/chains/${chainId}/safes/${safeAddress}/cloud-cosigner/policy`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { chainId, safeAddress }) => [
        { type: 'cloud-cosigner-status', id: `${chainId}:${safeAddress}` },
      ],
    }),
    getCloudCosignerReview: build.query<
      CloudCosignerReview,
      { chainId: string; safeAddress: string; safeTxHash: string }
    >({
      query: ({ chainId, safeAddress, safeTxHash }) =>
        `/v1/chains/${chainId}/safes/${safeAddress}/cloud-cosigner/reviews/${safeTxHash}`,
    }),
  }),
})

export const {
  useGetCloudCosignerInfoQuery,
  useGetSafeCloudCosignerStatusQuery,
  useUpdateCloudCosignerPolicyMutation,
  useGetCloudCosignerReviewQuery,
} = cloudCosignerApi
