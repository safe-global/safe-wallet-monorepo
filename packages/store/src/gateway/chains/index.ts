import { type Chain as ChainInfo } from '../AUTO_GENERATED/chains'
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit'
import { retry } from '@reduxjs/toolkit/query'
import { cgwClient, dynamicBaseQuery } from '../cgwClient'
import type {
  QueryReturnValue,
  FetchBaseQueryMeta,
  FetchBaseQueryError,
  BaseQueryApi,
  FetchArgs,
} from '@reduxjs/toolkit/query'

export const chainsAdapter = createEntityAdapter<ChainInfo, string>({ selectId: (chain: ChainInfo) => chain.chainId })
export const initialState = chainsAdapter.getInitialState()

const retryingBaseQuery = retry(dynamicBaseQuery, {
  maxRetries: 5,
  backoff: async (attempt) => {
    const base = 3000 * Math.pow(2, attempt)
    const jitter = Math.random() * base * 0.5
    await new Promise((resolve) => setTimeout(resolve, base + jitter))
  },
})

const getChainsConfigs = async (
  api: BaseQueryApi,
  url: '/v1/chains' | '/v2/chains',
  serviceKey: string | undefined,
  args: string | FetchArgs = { url, params: { ...(serviceKey ? { serviceKey: serviceKey } : {}), cursor: 'limit=50&offset=0' } },
  results: ChainInfo[] = [],
): Promise<QueryReturnValue<EntityState<ChainInfo, string>, FetchBaseQueryError, FetchBaseQueryMeta>> => {
  const response = await retryingBaseQuery(args, api, {})

  if (response.error) {
    return { error: response.error }
  }

  const data = response.data as { results: ChainInfo[]; next?: string }

  const nextResults = [...results, ...data.results]

  if (data.next) {
    const { pathname, search } = new URL(data.next)
    const nextUrl = pathname + search
    return getChainsConfigs(api, url, serviceKey, nextUrl, nextResults)
  }

  return { data: chainsAdapter.setAll(initialState, nextResults) }
}

export const apiSliceWithChainsConfig = cgwClient.injectEndpoints({
  endpoints: (builder) => ({
    getChainsConfig: builder.query<EntityState<ChainInfo, string>, void>({
      queryFn: async (_arg, api) => {
        return getChainsConfigs(api, '/v1/chains', undefined)
      },
    }),
    getChainsConfigV2: builder.query<EntityState<ChainInfo, string>, string>({
      queryFn: async (serviceKey, api) => {
        if (!serviceKey) {
          return { error: { status: 'CUSTOM_ERROR', error: 'serviceKey is required' } as FetchBaseQueryError }
        }
        return getChainsConfigs(api, '/v2/chains', serviceKey)
      },
    }),
  }),
  overrideExisting: true,
})

export const { useGetChainsConfigQuery, useGetChainsConfigV2Query } = apiSliceWithChainsConfig
