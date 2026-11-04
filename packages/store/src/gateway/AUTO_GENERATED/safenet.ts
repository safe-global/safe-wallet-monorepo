import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['safenet'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      safenetChecksRequestCheckV1: build.mutation<
        SafenetChecksRequestCheckV1ApiResponse,
        SafenetChecksRequestCheckV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/safenet/checks`,
          method: 'POST',
          body: queryArg.createSafenetCheckDto,
        }),
        invalidatesTags: ['safenet'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type SafenetChecksRequestCheckV1ApiResponse = unknown
export type SafenetChecksRequestCheckV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address (0x prefixed hex string) */
  safeAddress: string
  /** Space UUID */
  spaceId: string
  createSafenetCheckDto: CreateSafenetCheckDto
}
export type CreateSafenetCheckDto = {
  /** Safe transaction hash */
  safeTxHash: string
}
export const { useSafenetChecksRequestCheckV1Mutation } = injectedRtkApi
