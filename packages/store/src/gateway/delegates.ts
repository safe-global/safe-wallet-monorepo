import { cgwClient as api } from './cgwClient'
import {
  addTagTypes,
  type CreateDelegateDto,
  type DelegatePage,
  type DeleteDelegateV2Dto,
} from './AUTO_GENERATED/delegates'

export type DelegatesGetDelegatesV3ApiResponse =
  /** status 200 Paginated list of delegates retrieved successfully */ DelegatePage
export type DelegatesGetDelegatesV3ApiArg = {
  chainId: string
  cursor?: string
  label?: string
  delegator?: string
  delegate?: string
  safe?: string
}

export type DelegatesPostDelegateV3ApiResponse = unknown
export type DelegatesPostDelegateV3ApiArg = {
  chainId: string
  createDelegateDto: CreateDelegateDto
}

export type DelegatesDeleteDelegateV3ApiResponse = unknown
export type DelegatesDeleteDelegateV3ApiArg = {
  chainId: string
  delegateAddress: string
  deleteDelegateV2Dto: DeleteDelegateV2Dto
}

export type DelegatesUpdateDelegateV3ApiResponse = unknown
export type DelegatesUpdateDelegateV3ApiArg = {
  chainId: string
  createDelegateDto: CreateDelegateDto
}

export const delegatesApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      delegatesGetDelegatesV3: build.query<DelegatesGetDelegatesV3ApiResponse, DelegatesGetDelegatesV3ApiArg>({
        query: (queryArg) => ({
          url: `/v3/chains/${queryArg.chainId}/delegates`,
          params: {
            cursor: queryArg.cursor,
            label: queryArg.label,
            delegator: queryArg.delegator,
            delegate: queryArg.delegate,
            safe: queryArg.safe,
          },
        }),
        providesTags: ['delegates'],
      }),
      delegatesPostDelegateV3: build.mutation<DelegatesPostDelegateV3ApiResponse, DelegatesPostDelegateV3ApiArg>({
        query: (queryArg) => ({
          url: `/v3/chains/${queryArg.chainId}/delegates`,
          method: 'POST',
          body: queryArg.createDelegateDto,
        }),
        invalidatesTags: ['delegates'],
      }),
      delegatesDeleteDelegateV3: build.mutation<DelegatesDeleteDelegateV3ApiResponse, DelegatesDeleteDelegateV3ApiArg>({
        query: (queryArg) => ({
          url: `/v3/chains/${queryArg.chainId}/delegates/${queryArg.delegateAddress}`,
          method: 'DELETE',
          body: queryArg.deleteDelegateV2Dto,
        }),
        invalidatesTags: ['delegates'],
      }),
      delegatesUpdateDelegateV3: build.mutation<DelegatesUpdateDelegateV3ApiResponse, DelegatesUpdateDelegateV3ApiArg>({
        query: (queryArg) => ({
          url: `/v3/chains/${queryArg.chainId}/delegates`,
          method: 'PATCH',
          body: queryArg.createDelegateDto,
        }),
        invalidatesTags: ['delegates'],
      }),
    }),
  })

export const {
  useDelegatesGetDelegatesV3Query,
  useLazyDelegatesGetDelegatesV3Query,
  useDelegatesPostDelegateV3Mutation,
  useDelegatesDeleteDelegateV3Mutation,
  useDelegatesUpdateDelegateV3Mutation,
} = delegatesApi
