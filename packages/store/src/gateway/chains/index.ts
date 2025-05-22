import { type Chain as ChainInfo } from '../AUTO_GENERATED/chains'
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit'
import { cgwClient, getBaseUrl } from '../cgwClient'
import { QueryReturnValue, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query'

export const chainsAdapter = createEntityAdapter<ChainInfo, string>({ selectId: (chain: ChainInfo) => chain.chainId })
export const initialState = chainsAdapter.getInitialState()

const getChainsConfigs = async (
  url = `${getBaseUrl()}/v1/chains`,
  results: ChainInfo[] = [],
): Promise<EntityState<ChainInfo, string>> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()

  const nextResults = [...results, ...data.results]

  if (data.next) {
    return getChainsConfigs(data.next, nextResults)
  }

  return chainsAdapter.setAll(initialState, nextResults)
}

const getChains = async (): Promise<
  QueryReturnValue<EntityState<ChainInfo, string>, FetchBaseQueryError, FetchBaseQueryMeta>
> => {
  try {
    const data = await getChainsConfigs()
    return { data }
  } catch (error) {
    return { error: error as FetchBaseQueryError }
  }
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
