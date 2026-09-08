import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['tokens'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      tokensGetTokensV1: build.query<TokensGetTokensV1ApiResponse, TokensGetTokensV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/tokens`,
          params: {
            addresses: queryArg.addresses,
          },
        }),
        providesTags: ['tokens'],
      }),
      tokensGetTokenV1: build.query<TokensGetTokenV1ApiResponse, TokensGetTokenV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/tokens/${queryArg.address}` }),
        providesTags: ['tokens'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type TokensGetTokensV1ApiResponse = /** status 200 Token metadata for the known addresses, in request order */ (
  | NativeTokenMetadata
  | Erc20TokenMetadata
  | Erc721TokenMetadata
)[]
export type TokensGetTokensV1ApiArg = {
  /** Chain ID the token is deployed on */
  chainId: string
  /** Comma-separated token contract addresses, at most 20 */
  addresses: string
}
export type TokensGetTokenV1ApiResponse =
  /** status 200 Token metadata */
  NativeTokenMetadata | Erc20TokenMetadata | Erc721TokenMetadata
export type TokensGetTokenV1ApiArg = {
  /** Chain ID the token is deployed on */
  chainId: string
  /** Token contract address (0x prefixed hex string) */
  address: string
}
export type NativeTokenMetadata = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  /** Whether the Transaction Service lists the token in one of its imported token lists */
  trusted: boolean
  type: 'NATIVE_TOKEN'
}
export type Erc20TokenMetadata = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  /** Whether the Transaction Service lists the token in one of its imported token lists */
  trusted: boolean
  type: 'ERC20'
}
export type Erc721TokenMetadata = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  /** Whether the Transaction Service lists the token in one of its imported token lists */
  trusted: boolean
  type: 'ERC721'
}
export const {
  useTokensGetTokensV1Query,
  useLazyTokensGetTokensV1Query,
  useTokensGetTokenV1Query,
  useLazyTokensGetTokenV1Query,
} = injectedRtkApi
