import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['relay'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      relayRelayV1: build.mutation<RelayRelayV1ApiResponse, RelayRelayV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/relay`, method: 'POST', body: queryArg.relayDto }),
        invalidatesTags: ['relay'],
      }),
      relayGetRelaysRemainingV1: build.query<RelayGetRelaysRemainingV1ApiResponse, RelayGetRelaysRemainingV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/relay/${queryArg.safeAddress}` }),
        providesTags: ['relay'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type RelayRelayV1ApiResponse = /** status 200  */ Relay
export type RelayRelayV1ApiArg = {
  chainId: string
  relayDto: RelayDto
}
export type RelayGetRelaysRemainingV1ApiResponse = /** status 200  */ RelaysRemaining
export type RelayGetRelaysRemainingV1ApiArg = {
  chainId: string
  safeAddress: string
}
export type Relay = {
  taskId: string
}
export type RelayDto = {
  version: string
  to: string
  data: string
  /** If specified, a gas buffer of 150k will be added on top of the expected gas usage for the transaction.
          This is for the <a href="https://docs.gelato.network/developer-services/relay/quick-start/optional-parameters" target="_blank">
          Gelato Relay execution overhead</a>, reducing the chance of the task cancelling before it is executed on-chain. */
  gasLimit?: string | null
}
export type RelaysRemaining = {
  remaining: number
  limit: number
}
export const { useRelayRelayV1Mutation, useRelayGetRelaysRemainingV1Query, useLazyRelayGetRelaysRemainingV1Query } =
  injectedRtkApi
