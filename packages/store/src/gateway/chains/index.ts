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
    return { error: response.error }
  }

  const data = response.data as { results: ChainInfo[]; next?: string }

  const nextResults = [...results, ...data.results]

  if (data.next) {
    // Extract the relative path from the next URL
    const nextUrl = new URL(data.next).pathname + new URL(data.next).search
    return getChainsConfigs(nextUrl, nextResults)
  }

  return { data: chainsAdapter.setAll(initialState, nextResults) }
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
