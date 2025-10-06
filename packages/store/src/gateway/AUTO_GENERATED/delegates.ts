import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['delegates'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      delegatesGetDelegatesV1: build.query<DelegatesGetDelegatesV1ApiResponse, DelegatesGetDelegatesV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/delegates`,
          params: {
            safe: queryArg.safe,
            delegate: queryArg.delegate,
            delegator: queryArg.delegator,
            label: queryArg.label,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['delegates'],
      }),
      delegatesPostDelegateV1: build.mutation<DelegatesPostDelegateV1ApiResponse, DelegatesPostDelegateV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/delegates`,
          method: 'POST',
          body: queryArg.createDelegateDto,
        }),
        invalidatesTags: ['delegates'],
      }),
      delegatesDeleteDelegateV1: build.mutation<DelegatesDeleteDelegateV1ApiResponse, DelegatesDeleteDelegateV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/delegates/${queryArg.delegateAddress}`,
          method: 'DELETE',
          body: queryArg.deleteDelegateDto,
        }),
        invalidatesTags: ['delegates'],
      }),
      delegatesGetDelegatesV2: build.query<DelegatesGetDelegatesV2ApiResponse, DelegatesGetDelegatesV2ApiArg>({
        query: (queryArg) => ({
          url: `/v2/chains/${queryArg.chainId}/delegates`,
          params: {
            safe: queryArg.safe,
            delegate: queryArg.delegate,
            delegator: queryArg.delegator,
            label: queryArg.label,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['delegates'],
      }),
      delegatesPostDelegateV2: build.mutation<DelegatesPostDelegateV2ApiResponse, DelegatesPostDelegateV2ApiArg>({
        query: (queryArg) => ({
          url: `/v2/chains/${queryArg.chainId}/delegates`,
          method: 'POST',
          body: queryArg.createDelegateDto,
        }),
        invalidatesTags: ['delegates'],
      }),
      delegatesDeleteDelegateV2: build.mutation<DelegatesDeleteDelegateV2ApiResponse, DelegatesDeleteDelegateV2ApiArg>({
        query: (queryArg) => ({
          url: `/v2/chains/${queryArg.chainId}/delegates/${queryArg.delegateAddress}`,
          method: 'DELETE',
          body: queryArg.deleteDelegateV2Dto,
        }),
        invalidatesTags: ['delegates'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type DelegatesGetDelegatesV1ApiResponse =
  /** status 200 Paginated list of delegates retrieved successfully */ DelegatePage
export type DelegatesGetDelegatesV1ApiArg = {
  /** Chain ID where delegates are registered */
  chainId: string
  /** Filter by Safe address */
  safe?: string
  /** Filter by delegate address */
  delegate?: string
  /** Filter by delegator address */
  delegator?: string
  /** Filter by delegate label */
  label?: string
  /** Pagination cursor for retrieving the next set of results */
  cursor?: string
}
export type DelegatesPostDelegateV1ApiResponse = unknown
export type DelegatesPostDelegateV1ApiArg = {
  /** Chain ID where the delegate will be registered */
  chainId: string
  /** Delegate creation data including Safe address, delegate address, and signature */
  createDelegateDto: CreateDelegateDto
}
export type DelegatesDeleteDelegateV1ApiResponse = unknown
export type DelegatesDeleteDelegateV1ApiArg = {
  /** Chain ID where the delegate is registered */
  chainId: string
  /** Delegate address to delete (0x prefixed hex string) */
  delegateAddress: string
  /** Signature proving authorization to delete the delegate */
  deleteDelegateDto: DeleteDelegateDto
}
export type DelegatesGetDelegatesV2ApiResponse =
  /** status 200 Paginated list of delegates retrieved successfully */ DelegatePage
export type DelegatesGetDelegatesV2ApiArg = {
  /** Chain ID where delegates are registered */
  chainId: string
  /** Filter by Safe address (0x prefixed hex string) */
  safe?: string
  /** Filter by delegate address (0x prefixed hex string) */
  delegate?: string
  /** Filter by delegator address (0x prefixed hex string) */
  delegator?: string
  /** Filter by delegate label or name */
  label?: string
  /** Pagination cursor for retrieving the next set of results */
  cursor?: string
}
export type DelegatesPostDelegateV2ApiResponse = unknown
export type DelegatesPostDelegateV2ApiArg = {
  /** Chain ID where the delegate will be registered */
  chainId: string
  /** Delegate creation data including Safe address, delegate address, label, and authorization signature */
  createDelegateDto: CreateDelegateDto
}
export type DelegatesDeleteDelegateV2ApiResponse = unknown
export type DelegatesDeleteDelegateV2ApiArg = {
  /** Chain ID where the delegate is registered */
  chainId: string
  /** Delegate address to remove (0x prefixed hex string) */
  delegateAddress: string
  /** Signature and data proving authorization to delete the delegate */
  deleteDelegateV2Dto: DeleteDelegateV2Dto
}
export type Delegate = {
  safe?: string | null
  delegate: string
  delegator: string
  label: string
}
export type DelegatePage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: Delegate[]
}
export type CreateDelegateDto = {
  safe?: string | null
  delegate: string
  delegator: string
  signature: string
  label: string
}
export type DeleteDelegateDto = {
  delegate: string
  delegator: string
  signature: string
}
export type DeleteDelegateV2Dto = {
  delegator?: string | null
  safe?: string | null
  signature: string
}
export const {
  useDelegatesGetDelegatesV1Query,
  useLazyDelegatesGetDelegatesV1Query,
  useDelegatesPostDelegateV1Mutation,
  useDelegatesDeleteDelegateV1Mutation,
  useDelegatesGetDelegatesV2Query,
  useLazyDelegatesGetDelegatesV2Query,
  useDelegatesPostDelegateV2Mutation,
  useDelegatesDeleteDelegateV2Mutation,
} = injectedRtkApi
