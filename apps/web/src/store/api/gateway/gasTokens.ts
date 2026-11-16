import type { fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'

import { GATEWAY_URL } from '@/config/gateway'

// Local copy of payFromSafeFeePreview.ts's alias, so this module needs no import from the barrel it joins.
type GatewayEndpointBuilder = EndpointBuilder<
  ReturnType<typeof fakeBaseQuery<Error>>,
  'Submissions' | 'SafeOverviews',
  'gatewayApi'
>

/** An ERC-20 the fee service accepts as a gas token on a given chain. */
export type GasToken = {
  address: string
  symbol: string
}

type GasTokensPage = {
  results: GasToken[]
}

const isGasTokensPage = (value: unknown): value is GasTokensPage =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as GasTokensPage).results) &&
  (value as GasTokensPage).results.every(
    (token) => typeof token?.address === 'string' && typeof token?.symbol === 'string',
  )

/**
 * The gas tokens the fee service accepts, per chain.
 *
 * The Config Service is the single source of truth: the fee service checks a `gasToken` against
 * this same list and rejects a quote for anything else, so the selector must not offer a token
 * that isn't here. The chain's native token is always accepted and is not part of the list.
 *
 * The response is paged, but the CGW returns every token in `results`, so `next` is not followed.
 */
export const gasTokensEndpoints = (builder: GatewayEndpointBuilder) => ({
  getGasTokens: builder.query<GasToken[], { chainId: string }>({
    async queryFn({ chainId }) {
      try {
        const response = await fetch(`${GATEWAY_URL}/v1/chains/${chainId}/fees/gas-tokens`)

        if (!response.ok) {
          return { error: new Error(`Gas tokens request failed with status ${response.status}`) }
        }

        const body: unknown = await response.json()
        if (!isGasTokensPage(body)) {
          return { error: new Error('Gas tokens response did not match the expected shape') }
        }

        return { data: body.results }
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) }
      }
    },
  }),
})
