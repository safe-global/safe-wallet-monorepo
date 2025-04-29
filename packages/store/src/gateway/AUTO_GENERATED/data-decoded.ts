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
export type DataDecodedGetDataDecodedV1ApiResponse = /** status 200  */ DataDecoded
export type DataDecodedGetDataDecodedV1ApiArg = {
  chainId: string
  transactionDataDto: TransactionDataDto
}
export type BaseDataDecoded = {
  method: string
  parameters?: DataDecodedParameter[]
}
export type MultiSend = {
  operation: 0 | 1
  value: string
  dataDecoded?: BaseDataDecoded
  to: string
  data?: object
}
export type DataDecodedParameter = {
  name: string
  type: string
  value: object
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
