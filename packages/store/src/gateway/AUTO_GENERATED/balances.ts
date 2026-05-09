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
export type BalancesGetBalancesV1ApiResponse =
  /** status 200 Safe balances retrieved successfully with fiat conversions */ Balances
export type BalancesGetBalancesV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address (0x prefixed hex string) */
  safeAddress: string
  /** Fiat currency code for balance conversion (e.g., USD, EUR) */
  fiatCode: string
  /** If true, only returns balances for trusted tokens */
  trusted?: boolean
  /** If true, excludes spam tokens from results */
  excludeSpam?: boolean
}
export type BalancesGetSupportedFiatCodesV1ApiResponse =
  /** status 200 List of supported fiat currency codes (e.g., ["USD", "EUR", "GBP"]) */ string[]
export type BalancesGetSupportedFiatCodesV1ApiArg = void
export type NativeToken = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'NATIVE_TOKEN'
}
export type Erc20Token = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'ERC20'
}
export type Erc721Token = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'ERC721'
}
export type Balance = {
  balance: string
  fiatBalance: string
  fiatConversion: string
  tokenInfo: NativeToken | Erc20Token | Erc721Token
  fiatBalance24hChange?: string | null
}
export type Balances = {
  fiatTotal: string
  items: Balance[]
}
export const {
  useBalancesGetBalancesV1Query,
  useLazyBalancesGetBalancesV1Query,
  useBalancesGetSupportedFiatCodesV1Query,
  useLazyBalancesGetSupportedFiatCodesV1Query,
} = injectedRtkApi
