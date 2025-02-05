import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['owners'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      ownersGetSafesByOwnerV1: build.query<OwnersGetSafesByOwnerV1ApiResponse, OwnersGetSafesByOwnerV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/owners/${queryArg.ownerAddress}/safes` }),
        providesTags: ['owners'],
      }),
      ownersGetAllSafesByOwnerV1: build.query<OwnersGetAllSafesByOwnerV1ApiResponse, OwnersGetAllSafesByOwnerV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/owners/${queryArg.ownerAddress}/safes` }),
        providesTags: ['owners'],
      }),
      ownersGetAllSafesByOwnerV2: build.query<OwnersGetAllSafesByOwnerV2ApiResponse, OwnersGetAllSafesByOwnerV2ApiArg>({
        query: (queryArg) => ({ url: `/v2/owners/${queryArg.ownerAddress}/safes` }),
        providesTags: ['owners'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type OwnersGetSafesByOwnerV1ApiResponse = /** status 200  */ SafeList
export type OwnersGetSafesByOwnerV1ApiArg = {
  chainId: string
  ownerAddress: string
}
export type OwnersGetAllSafesByOwnerV1ApiResponse = /** status 200  */ SafeList
export type OwnersGetAllSafesByOwnerV1ApiArg = {
  ownerAddress: string
}
export type OwnersGetAllSafesByOwnerV2ApiResponse = /** status 200  */ {
  [key: string]: string[]
}
export type OwnersGetAllSafesByOwnerV2ApiArg = {
  ownerAddress: string
}
export type SafeList = {
  safes: string[]
}
export const {
  useOwnersGetSafesByOwnerV1Query,
  useOwnersGetAllSafesByOwnerV2Query,
  useLazyOwnersGetSafesByOwnerV1Query,
  useOwnersGetAllSafesByOwnerV1Query,
  useLazyOwnersGetAllSafesByOwnerV1Query,
} = injectedRtkApi
