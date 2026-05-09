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
      ownersGetAllSafesByOwnerV2: build.query<OwnersGetAllSafesByOwnerV2ApiResponse, OwnersGetAllSafesByOwnerV2ApiArg>({
        query: (queryArg) => ({ url: `/v2/owners/${queryArg.ownerAddress}/safes` }),
        providesTags: ['owners'],
      }),
      ownersGetAllSafesByOwnerV3: build.query<OwnersGetAllSafesByOwnerV3ApiResponse, OwnersGetAllSafesByOwnerV3ApiArg>({
        query: (queryArg) => ({ url: `/v3/owners/${queryArg.ownerAddress}/safes` }),
        providesTags: ['owners'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type OwnersGetSafesByOwnerV1ApiResponse = /** status 200 List of Safes owned by the specified address */ SafeList
export type OwnersGetSafesByOwnerV1ApiArg = {
  /** Chain ID to search for Safes */
  chainId: string
  /** Owner address to search Safes for (0x prefixed hex string) */
  ownerAddress: string
}
export type OwnersGetAllSafesByOwnerV2ApiResponse =
  /** status 200 Map of chain IDs to arrays of Safe addresses owned by the address */ {
    [key: string]: string[]
  }
export type OwnersGetAllSafesByOwnerV2ApiArg = {
  /** Owner address to search Safes for (0x prefixed hex string) */
  ownerAddress: string
}
export type OwnersGetAllSafesByOwnerV3ApiResponse =
  /** status 200 Map of chain IDs to arrays of Safe addresses owned by the address */ {
    [key: string]: string[]
  }
export type OwnersGetAllSafesByOwnerV3ApiArg = {
  /** Owner address to search Safes for (0x prefixed hex string) */
  ownerAddress: string
}
export type SafeList = {
  safes: string[]
}
export const {
  useOwnersGetSafesByOwnerV1Query,
  useLazyOwnersGetSafesByOwnerV1Query,
  useOwnersGetAllSafesByOwnerV2Query,
  useLazyOwnersGetAllSafesByOwnerV2Query,
  useOwnersGetAllSafesByOwnerV3Query,
  useLazyOwnersGetAllSafesByOwnerV3Query,
} = injectedRtkApi
