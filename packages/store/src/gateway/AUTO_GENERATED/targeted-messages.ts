import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['targeted-messaging'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      targetedMessagingGetSubmissionV1: build.query<
        TargetedMessagingGetSubmissionV1ApiResponse,
        TargetedMessagingGetSubmissionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/targeted-messaging/outreaches/${queryArg.outreachId}/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/signers/${queryArg.signerAddress}/submissions`,
        }),
        providesTags: ['targeted-messaging'],
      }),
      targetedMessagingCreateSubmissionV1: build.mutation<
        TargetedMessagingCreateSubmissionV1ApiResponse,
        TargetedMessagingCreateSubmissionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/targeted-messaging/outreaches/${queryArg.outreachId}/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/signers/${queryArg.signerAddress}/submissions`,
          method: 'POST',
          body: queryArg.createSubmissionDto,
        }),
        invalidatesTags: ['targeted-messaging'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type TargetedMessagingGetSubmissionV1ApiResponse = /** status 200  */ Submission
export type TargetedMessagingGetSubmissionV1ApiArg = {
  outreachId: number
  chainId: string
  safeAddress: string
  signerAddress: string
}
export type TargetedMessagingCreateSubmissionV1ApiResponse = /** status 201  */ Submission
export type TargetedMessagingCreateSubmissionV1ApiArg = {
  outreachId: number
  chainId: string
  safeAddress: string
  signerAddress: string
  createSubmissionDto: CreateSubmissionDto
}
export type Submission = {
  outreachId: number
  targetedSafeId: number
  signerAddress: string
  completionDate?: string | null
}
export type CreateSubmissionDto = {
  completed: boolean
}
export const {
  useTargetedMessagingGetSubmissionV1Query,
  useLazyTargetedMessagingGetSubmissionV1Query,
  useTargetedMessagingCreateSubmissionV1Mutation,
} = injectedRtkApi
