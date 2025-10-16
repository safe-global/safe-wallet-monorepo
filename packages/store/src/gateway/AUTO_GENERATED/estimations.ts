import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['estimations'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      estimationsGetEstimationV2: build.mutation<
        EstimationsGetEstimationV2ApiResponse,
        EstimationsGetEstimationV2ApiArg
      >({
        query: (queryArg) => ({
          url: `/v2/chains/${queryArg.chainId}/safes/${queryArg.address}/multisig-transactions/estimations`,
          method: 'POST',
          body: queryArg.getEstimationDto,
        }),
        invalidatesTags: ['estimations'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type EstimationsGetEstimationV2ApiResponse =
  /** status 200 Gas estimation calculated successfully with recommended values */ EstimationResponse
export type EstimationsGetEstimationV2ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address (0x prefixed hex string) */
  address: string
  /** Transaction details for gas estimation including recipient, value, and data */
  getEstimationDto: GetEstimationDto
}
export type EstimationResponse = {
  currentNonce: number
  recommendedNonce: number
  safeTxGas: string
}
export type Operation = 0 | 1
export type GetEstimationDto = {
  to: string
  value: string
  data?: string | null
  /** Operation type: 0 for CALL, 1 for DELEGATE */
  operation: Operation
}
export const { useEstimationsGetEstimationV2Mutation } = injectedRtkApi
