import type { fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'

import { GATEWAY_URL } from '@/config/gateway'
import { Errors, logError } from '@/services/exceptions'

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

// The CGW returns every token in `results`, so `next` is not followed.
export const gasTokensEndpoints = (builder: GatewayEndpointBuilder) => ({
  getGasTokens: builder.query<GasToken[], { chainId: string }>({
    async queryFn({ chainId }) {
      const fail = (error: unknown) => {
        logError(Errors._660, error)
        return { error: error instanceof Error ? error : new Error(String(error)) }
      }
      try {
        const response = await fetch(`${GATEWAY_URL}/v1/chains/${chainId}/fees/gas-tokens`)

        if (!response.ok) {
          return fail(new Error(`Gas tokens request failed with status ${response.status}`))
        }

        const body: unknown = await response.json()
        if (!isGasTokensPage(body)) {
          return fail(new Error('Gas tokens response did not match the expected shape'))
        }

        return { data: body.results }
      } catch (error) {
        return fail(error)
      }
    },
  }),
})
