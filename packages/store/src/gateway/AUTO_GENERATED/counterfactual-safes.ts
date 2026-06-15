import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['counterfactual-safes'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      counterfactualSafesCreateV1: build.mutation<
        CounterfactualSafesCreateV1ApiResponse,
        CounterfactualSafesCreateV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/users/counterfactual-safes`,
          method: 'POST',
          body: queryArg.createCounterfactualSafesDto,
        }),
        invalidatesTags: ['counterfactual-safes'],
      }),
      counterfactualSafesGetV1: build.query<CounterfactualSafesGetV1ApiResponse, CounterfactualSafesGetV1ApiArg>({
        query: () => ({ url: `/v1/users/counterfactual-safes` }),
        providesTags: ['counterfactual-safes'],
      }),
      counterfactualSafesDeleteV1: build.mutation<
        CounterfactualSafesDeleteV1ApiResponse,
        CounterfactualSafesDeleteV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/users/counterfactual-safes`,
          method: 'DELETE',
          body: queryArg.deleteCounterfactualSafesDto,
        }),
        invalidatesTags: ['counterfactual-safes'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type CounterfactualSafesCreateV1ApiResponse = unknown
export type CounterfactualSafesCreateV1ApiArg = {
  /** Counterfactual Safe creation parameters */
  createCounterfactualSafesDto: CreateCounterfactualSafesDto
}
export type CounterfactualSafesGetV1ApiResponse =
  /** status 200 Counterfactual Safes retrieved successfully */ GetCounterfactualSafesResponse
export type CounterfactualSafesGetV1ApiArg = void
export type CounterfactualSafesDeleteV1ApiResponse = unknown
export type CounterfactualSafesDeleteV1ApiArg = {
  deleteCounterfactualSafesDto: DeleteCounterfactualSafesDto
}
export type CounterfactualSafeDto = {
  chainId: string
  address: string
  factoryAddress: string
  masterCopy: string
  saltNonce: string
  safeVersion: string
  threshold: number
  owners: string[]
  fallbackHandler?: string | null
  to?: string | null
  data: string
  paymentToken?: string | null
  payment?: string | null
  paymentReceiver?: string | null
}
export type CreateCounterfactualSafesDto = {
  safes: CounterfactualSafeDto[]
}
export type GetCounterfactualSafeItem = {
  address: string
  factoryAddress: string
  masterCopy: string
  saltNonce: string
  safeVersion: string
  threshold: number
  owners: string[]
  fallbackHandler: string | null
  to: string | null
  data: string
  paymentToken: string | null
  payment: string | null
  paymentReceiver: string | null
}
export type GetCounterfactualSafesResponse = {
  safes: {
    [key: string]: GetCounterfactualSafeItem[]
  }
}
export type DeleteCounterfactualSafeDto = {
  chainId: string
  address: string
}
export type DeleteCounterfactualSafesDto = {
  safes: DeleteCounterfactualSafeDto[]
}
export const {
  useCounterfactualSafesCreateV1Mutation,
  useCounterfactualSafesGetV1Query,
  useLazyCounterfactualSafesGetV1Query,
  useCounterfactualSafesDeleteV1Mutation,
} = injectedRtkApi
