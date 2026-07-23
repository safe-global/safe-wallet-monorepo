import { cgwClient as api } from '../cgwClient'
import { buildMockAvailablePolicies, buildMockActivePolicies } from './mocks'
import type { GetPoliciesResponse, GetActivePoliciesResponse, PolicyQueryArg } from './types'

export const addTagTypes = ['policies'] as const

/**
 * Policy engine endpoints (space-scoped, credentialed once real). Currently
 * MOCKED via `queryFn` — see ./mocks. To go live, replace each `queryFn` with
 * `query: (arg) => ({ url: `/v1/spaces/${arg.spaceId}/safes/${arg.chainId}:${arg.safeAddress}/policies[/active]` })`.
 */
export const policiesApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    policiesGetPoliciesV1: build.query<GetPoliciesResponse, PolicyQueryArg>({
      queryFn: async (arg) => ({ data: buildMockAvailablePolicies(arg) }),
      providesTags: ['policies'],
    }),
    policiesGetActivePoliciesV1: build.query<GetActivePoliciesResponse, PolicyQueryArg>({
      queryFn: async () => ({ data: buildMockActivePolicies() }),
      providesTags: ['policies'],
    }),
  }),
  overrideExisting: false,
})

export const { usePoliciesGetPoliciesV1Query, usePoliciesGetActivePoliciesV1Query } = policiesApi

export * from './types'
