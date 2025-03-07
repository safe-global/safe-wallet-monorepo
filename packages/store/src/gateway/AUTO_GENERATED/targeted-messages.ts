import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['targeted-messaging'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      targetedMessagingGetTargetedSafeV1: build.query<
        TargetedMessagingGetTargetedSafeV1ApiResponse,
        TargetedMessagingGetTargetedSafeV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/targeted-messaging/outreaches/${queryArg.outreachId}/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}`,
        }),
        providesTags: ['targeted-messaging'],
      }),
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
export type TargetedMessagingGetTargetedSafeV1ApiResponse = /** status 200  */ TargetedSafe
export type TargetedMessagingGetTargetedSafeV1ApiArg = {
  outreachId: number
  chainId: string
  safeAddress: string
}
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
export type TargetedSafe = {
  outreachId: number
  address: string
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
  useTargetedMessagingGetTargetedSafeV1Query,
  useLazyTargetedMessagingGetTargetedSafeV1Query,
  useTargetedMessagingGetSubmissionV1Query,
  useLazyTargetedMessagingGetSubmissionV1Query,
  useTargetedMessagingCreateSubmissionV1Mutation,
} = injectedRtkApi
