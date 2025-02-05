import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['contracts'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      contractsGetContractV1: build.query<ContractsGetContractV1ApiResponse, ContractsGetContractV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/contracts/${queryArg.contractAddress}` }),
        providesTags: ['contracts'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type ContractsGetContractV1ApiResponse = /** status 200  */ Contract
export type ContractsGetContractV1ApiArg = {
  chainId: string
  contractAddress: string
}
export type Contract = {
  address: string
  name: string
  displayName: string
  logoUri: string
  contractAbi?: object | null
  trustedForDelegateCall: boolean
}
export const { useContractsGetContractV1Query, useLazyContractsGetContractV1Query } = injectedRtkApi
