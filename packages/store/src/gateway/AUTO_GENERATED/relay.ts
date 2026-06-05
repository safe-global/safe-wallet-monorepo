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
      relayGetTaskStatusV1: build.query<RelayGetTaskStatusV1ApiResponse, RelayGetTaskStatusV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/relay/status/${queryArg.taskId}` }),
        providesTags: ['relay'],
      }),
      relayGetRelaysRemainingV1: build.query<RelayGetRelaysRemainingV1ApiResponse, RelayGetRelaysRemainingV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/relay/${queryArg.safeAddress}`,
          params: {
            safeTxHash: queryArg.safeTxHash,
          },
        }),
        providesTags: ['relay'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type RelayRelayV1ApiResponse = /** status 200 Transaction relayed successfully */ Relay
export type RelayRelayV1ApiArg = {
  /** Chain ID where the Safe transaction will be executed */
  chainId: string
  /** Transaction data to relay. safeTxHash is required on relay-fee chains and must correspond to the to + data fields. */
  relayDto: RelayDto
}
export type RelayGetTaskStatusV1ApiResponse = /** status 200 Task status retrieved successfully */ RelayTaskStatus
export type RelayGetTaskStatusV1ApiArg = {
  /** Chain ID associated with the relay task */
  chainId: string
  /** Task ID returned from the relay transaction */
  taskId: string
}
export type RelayGetRelaysRemainingV1ApiResponse =
  /** status 200 Remaining relay quota retrieved successfully */ RelaysRemaining
export type RelayGetRelaysRemainingV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address (0x prefixed hex string) */
  safeAddress: string
  /** Safe transaction hash (0x prefixed hex string). Required on relay-fee chains to check per-transaction eligibility with the fee service. Optional on daily-limit and no-fee-campaign chains. */
  safeTxHash?: string
}
export type Relay = {
  taskId: string
}
export type RelayDto = {
  version: string
  to: string
  data: string
  /** Accepted for backward compatibility and validation; not forwarded to the relay provider (Gelato). */
  gasLimit?: string | null
  /** Safe transaction hash for relay-fee eligibility check */
  safeTxHash?: string
}
export type RelayTaskStatusReceipt = {
  transactionHash: string
}
export type RelayTaskStatus = {
  /** Relay task status code: 100=Pending, 110=Submitted, 200=Included, 400=Rejected, 500=Reverted */
  status: 100 | 110 | 200 | 400 | 500
  /** On-chain receipt. Only present when status is 200 (Included) or 500 (Reverted) */
  receipt?: RelayTaskStatusReceipt
}
export type RelaysRemaining = {
  remaining: number
  limit: number
}
export const {
  useRelayRelayV1Mutation,
  useRelayGetTaskStatusV1Query,
  useLazyRelayGetTaskStatusV1Query,
  useRelayGetRelaysRemainingV1Query,
  useLazyRelayGetRelaysRemainingV1Query,
} = injectedRtkApi
