import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['data-decoded'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      dataDecodedGetDataDecodedV1: build.mutation<
        DataDecodedGetDataDecodedV1ApiResponse,
        DataDecodedGetDataDecodedV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/data-decoder`,
          method: 'POST',
          body: queryArg.transactionDataDto,
        }),
        invalidatesTags: ['data-decoded'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type DataDecodedGetDataDecodedV1ApiResponse =
  /** status 200 Transaction data decoded successfully with method name, parameters, and values */ DataDecoded
export type DataDecodedGetDataDecodedV1ApiArg = {
  /** Chain ID where the transaction will be executed */
  chainId: string
  /** Transaction data to decode, including contract address and data payload */
  transactionDataDto: TransactionDataDto
}
export type BaseDataDecoded = {
  method: string
  parameters?: DataDecodedParameter[]
}
export type Operation = 0 | 1
export type MultiSend = {
  /** Operation type: 0 for CALL, 1 for DELEGATE */
  operation: Operation
  value: string
  dataDecoded?: BaseDataDecoded
  to: string
  /** Hexadecimal encoded data */
  data: string | null
}
export type DataDecodedParameter = {
  name: string
  type: string
  /** Parameter value - typically a string, but may be an array of strings for array types (e.g., address[], uint256[]) */
  value: string | string[]
  valueDecoded?: BaseDataDecoded | MultiSend[] | null
}
export type DataDecoded = {
  method: string
  parameters?: DataDecodedParameter[] | null
  accuracy?: 'FULL_MATCH' | 'PARTIAL_MATCH' | 'ONLY_FUNCTION_MATCH' | 'NO_MATCH' | 'UNKNOWN'
}
export type TransactionDataDto = {
  /** Hexadecimal value */
  data: string
  /** The target Ethereum address */
  to?: string
}
export const { useDataDecodedGetDataDecodedV1Mutation } = injectedRtkApi
