import { type Chain as ChainInfo } from '../AUTO_GENERATED/chains'
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit'
import { cgwClient, dynamicBaseQuery } from '../cgwClient'
import type { QueryReturnValue, FetchBaseQueryMeta, FetchBaseQueryError } from '@reduxjs/toolkit/query'

export const chainsAdapter = createEntityAdapter<ChainInfo, string>({ selectId: (chain: ChainInfo) => chain.chainId })
export const initialState = chainsAdapter.getInitialState()

const getChainsConfigs = async (
  url = '/v1/chains',
  results: ChainInfo[] = [],
): Promise<QueryReturnValue<EntityState<ChainInfo, string>, FetchBaseQueryError, FetchBaseQueryMeta>> => {
  const response = await dynamicBaseQuery(url, { endpoint: 'getChainsConfig', type: 'query' } as any, {})

  if (response.error) {
    console.error('[getChainsConfigs] Query error:', response.error)
    return { error: response.error }
  }

  const data = response.data as { results: ChainInfo[]; next?: string }
  console.log('[getChainsConfigs] Received', data.results?.length || 0, 'chains. Has next:', !!data.next)

  const nextResults = [...results, ...data.results]

  if (data.next) {
    // Extract the relative path from the next URL
    const nextUrl = new URL(data.next).pathname + new URL(data.next).search
    return getChainsConfigs(nextUrl, nextResults)
  }

  console.log('[getChainsConfigs] Total chains collected:', nextResults.length)
  const normalized = chainsAdapter.setAll(initialState, nextResults)
  console.log('[getChainsConfigs] Normalized data - IDs:', normalized.ids.length, 'Entities:', Object.keys(normalized.entities).length)
  return { data: normalized }
}

const getChains = async (): Promise<
  QueryReturnValue<EntityState<ChainInfo, string>, FetchBaseQueryError, FetchBaseQueryMeta>
> => {
  return getChainsConfigs()
}

export const apiSliceWithChainsConfig = cgwClient.injectEndpoints({
  endpoints: (builder) => ({
    getChainsConfig: builder.query<EntityState<ChainInfo, string>, void>({
      queryFn: async () => {
        return getChains()
      },
    }),
  }),
  overrideExisting: true,
})

export const { useGetChainsConfigQuery } = apiSliceWithChainsConfig
