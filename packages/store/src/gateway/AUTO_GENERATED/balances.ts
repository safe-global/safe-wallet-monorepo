import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['balances'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      balancesGetBalancesV1: build.query<BalancesGetBalancesV1ApiResponse, BalancesGetBalancesV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/balances/${queryArg.fiatCode}`,
          params: {
            trusted: queryArg.trusted,
            exclude_spam: queryArg.excludeSpam,
          },
        }),
        providesTags: ['balances'],
      }),
      balancesGetSupportedFiatCodesV1: build.query<
        BalancesGetSupportedFiatCodesV1ApiResponse,
        BalancesGetSupportedFiatCodesV1ApiArg
      >({
        query: () => ({ url: `/v1/balances/supported-fiat-codes` }),
        providesTags: ['balances'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type BalancesGetBalancesV1ApiResponse = /** status 200  */ Balances
export type BalancesGetBalancesV1ApiArg = {
  chainId: string
  safeAddress: string
  fiatCode: string
  trusted?: boolean
  excludeSpam?: boolean
}
export type BalancesGetSupportedFiatCodesV1ApiResponse = /** status 200  */ string[]
export type BalancesGetSupportedFiatCodesV1ApiArg = void
export type Token = {
  address: string
  decimals?: number | null
  logoUri: string
  name: string
  symbol: string
  type: 'ERC721' | 'ERC20' | 'NATIVE_TOKEN' | 'UNKNOWN'
}
export type Balance = {
  balance: string
  fiatBalance: string
  fiatConversion: string
  tokenInfo: Token
}
export type Balances = {
  fiatTotal: string
  items: Balance[]
}
export const { useBalancesGetBalancesV1Query, useBalancesGetSupportedFiatCodesV1Query } = injectedRtkApi
