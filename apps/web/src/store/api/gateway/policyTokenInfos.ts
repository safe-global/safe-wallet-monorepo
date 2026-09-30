import type { fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'
import chunk from 'lodash/chunk'

import {
  cgwApi as tokensApi,
  type TokensGetTokensV1ApiResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/tokens'

type GatewayEndpointBuilder = EndpointBuilder<
  ReturnType<typeof fakeBaseQuery<Error>>,
  'Submissions' | 'SafeOverviews',
  'gatewayApi'
>

export type TokenRef = { chainId: string; address: string }

export type TokenMetadata = TokensGetTokensV1ApiResponse[number]

/** Keyed by {@link tokenRefKey}. A token the gateway does not know has no entry. */
export type TokenInfoByRef = Record<string, TokenMetadata>

export const tokenRefKey = (chainId: string, address: string): string => `${chainId}:${address.toLowerCase()}`

/** The gateway caps one metadata request at this many addresses. */
export const TOKENS_PER_REQUEST = 20

type InitiateThunk = ReturnType<typeof tokensApi.endpoints.tokensGetTokensV1.initiate>
type DispatchFn = (action: InitiateThunk) => ReturnType<InitiateThunk>

const fetchTokens = async (
  chainId: string,
  addresses: string[],
  dispatch: DispatchFn,
): Promise<TokensGetTokensV1ApiResponse> => {
  const queryAction = dispatch(
    tokensApi.endpoints.tokensGetTokensV1.initiate({ chainId, addresses: addresses.join(',') }),
  )

  try {
    return await queryAction.unwrap()
  } finally {
    queryAction.unsubscribe()
  }
}

const groupByChain = (tokens: TokenRef[]): Map<string, string[]> => {
  const byChain = new Map<string, Set<string>>()

  for (const { chainId, address } of tokens) {
    const addresses = byChain.get(chainId) ?? new Set<string>()
    addresses.add(address.toLowerCase())
    byChain.set(chainId, addresses)
  }

  return new Map([...byChain].map(([chainId, addresses]) => [chainId, [...addresses]]))
}

/**
 * Token metadata for tokens spread over several chains, in one query. A chunk that fails leaves
 * its tokens without an entry rather than failing the whole lookup: a missing symbol degrades one
 * cell, a failed page hides every policy.
 */
export const policyTokenInfosEndpoints = (builder: GatewayEndpointBuilder) => ({
  getPolicyTokenInfos: builder.query<TokenInfoByRef, { tokens: TokenRef[] }>({
    serializeQueryArgs: ({ queryArgs }) => ({
      tokens: [...new Set(queryArgs.tokens.map((token) => tokenRefKey(token.chainId, token.address)))].sort(),
    }),
    async queryFn({ tokens }, { dispatch }) {
      const dispatchFn: DispatchFn = (action) => dispatch(action)
      const requests = [...groupByChain(tokens)].flatMap(([chainId, addresses]) =>
        chunk(addresses, TOKENS_PER_REQUEST).map((page) => ({ chainId, addresses: page })),
      )

      const results = await Promise.allSettled(
        requests.map(({ chainId, addresses }) => fetchTokens(chainId, addresses, dispatchFn)),
      )

      const data: TokenInfoByRef = {}
      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return

        for (const metadata of result.value) {
          data[tokenRefKey(requests[index].chainId, metadata.address)] = metadata
        }
      })

      return { data }
    },
  }),
})
