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

// Override chain display names where the API name differs from the canonical name
const CHAIN_NAME_OVERRIDES: Record<string, string> = {
  '10': 'OP Mainnet',
}

const applyChainNameOverrides = (chains: ChainInfo[]): ChainInfo[] =>
  chains.map((chain) => {
    const override = CHAIN_NAME_OVERRIDES[chain.chainId]
    return override ? { ...chain, chainName: override } : chain
  })

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
  args: string | FetchArgs = { url: '/v1/chains', params: { cursor: 'limit=50&offset=0' } },
  results: ChainInfo[] = [],
): Promise<QueryReturnValue<EntityState<ChainInfo, string>, FetchBaseQueryError, FetchBaseQueryMeta>> => {
  const response = await retryingBaseQuery(args, api, {})

  if (response.error) {
    return { error: response.error }
  }

  const data = response.data as { results: ChainInfo[]; next?: string }

  const nextResults = [...results, ...data.results]

  if (data.next) {
    const nextUrl = new URL(data.next).pathname + new URL(data.next).search
    return getChainsConfigs(api, nextUrl, nextResults)
  }

  return { data: chainsAdapter.setAll(initialState, applyChainNameOverrides(nextResults)) }
}

export const apiSliceWithChainsConfig = cgwClient.injectEndpoints({
  endpoints: (builder) => ({
    getChainsConfig: builder.query<EntityState<ChainInfo, string>, void>({
      queryFn: async (_arg, api) => {
        return getChainsConfigs(api)
      },
    }),
  }),
  overrideExisting: true,
})

export const { useGetChainsConfigQuery } = apiSliceWithChainsConfig
