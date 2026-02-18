import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['portfolio'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      portfolioGetPortfolioV1: build.query<PortfolioGetPortfolioV1ApiResponse, PortfolioGetPortfolioV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/portfolio/${queryArg.address}`,
          params: {
            fiatCode: queryArg.fiatCode,
            chainIds: queryArg.chainIds,
            trusted: queryArg.trusted,
            excludeDust: queryArg.excludeDust,
            sync: queryArg.sync,
          },
        }),
        providesTags: ['portfolio'],
      }),
      portfolioClearPortfolioV1: build.mutation<PortfolioClearPortfolioV1ApiResponse, PortfolioClearPortfolioV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/portfolio/${queryArg.address}`, method: 'DELETE' }),
        invalidatesTags: ['portfolio'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type PortfolioGetPortfolioV1ApiResponse = /** status 200  */ Portfolio
export type PortfolioGetPortfolioV1ApiArg = {
  /** Wallet address (0x prefixed hex string) */
  address: string
  /** Fiat currency code for balance conversion (e.g., USD, EUR) */
  fiatCode?: string
  /** Comma-separated list of chain IDs to filter by. If omitted, returns data for all chains. */
  chainIds?: string
  /** If true, only returns trusted tokens */
  trusted?: boolean
  /** If true, filters out dust positions (balance < $0.001 USD) */
  excludeDust?: boolean
  /** If true, waits for position data to be aggregated before responding (up to 30s) */
  sync?: boolean
}
export type PortfolioClearPortfolioV1ApiResponse = unknown
export type PortfolioClearPortfolioV1ApiArg = {
  /** Wallet address (0x prefixed hex string) */
  address: string
}
export type PortfolioNativeToken = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'NATIVE_TOKEN'
  /** The chain ID */
  chainId: string
  /** Whether the token is trusted (spam filter) */
  trusted: boolean
}
export type PortfolioErc20Token = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'ERC20'
  /** The chain ID */
  chainId: string
  /** Whether the token is trusted (spam filter) */
  trusted: boolean
}
export type PortfolioErc721Token = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'ERC721'
  /** The chain ID */
  chainId: string
  /** Whether the token is trusted (spam filter) */
  trusted: boolean
}
export type TokenBalance = {
  /** Token information */
  tokenInfo: PortfolioNativeToken | PortfolioErc20Token | PortfolioErc721Token
  /** Balance in smallest unit as string integer. Use decimals to convert. */
  balance: string
  /** Balance in requested fiat currency. Decimal string without exponent notation or thousand separators. */
  balanceFiat?: string
  /** Token price in requested fiat currency. Decimal string without exponent notation or thousand separators. */
  price?: string
  /** Price change as decimal (e.g., "-0.0431" for -4.31%). Decimal string without exponent notation. */
  priceChangePercentage1d?: string
}
export type AppBalanceAppInfo = {
  /** Application name */
  name: string
  /** Application logo URL (HTTPS) */
  logoUrl?: string
  /** Application URL (HTTPS) */
  url?: string
}
export type AppPosition = {
  /** Unique position key */
  key: string
  /** Position type (e.g., staked, lending, liquidity) */
  type: string
  /** Position name */
  name: string
  /** Group ID for grouping related positions together */
  groupId?: string
  /** Token information */
  tokenInfo: PortfolioNativeToken | PortfolioErc20Token | PortfolioErc721Token
  /** Receipt token address (pool address) representing this position. This is the contract address for the position token (LP token, staking receipt, etc.), not the underlying token. */
  receiptTokenAddress?: string
  /** Balance in smallest unit as string integer. Use decimals to convert. */
  balance: string
  /** Balance in requested fiat currency. Decimal string without exponent notation or thousand separators. */
  balanceFiat?: string
  /** Price change as decimal (e.g., "-0.0431" for -4.31%). Decimal string without exponent notation. */
  priceChangePercentage1d?: string
}
export type AppPositionGroup = {
  /** Group name (e.g., "Protocol A Vesting") */
  name: string
  /** Positions in this group */
  items: AppPosition[]
}
export type AppBalance = {
  /** Application information */
  appInfo: AppBalanceAppInfo
  /** Total balance in fiat currency across all position groups. Decimal string without exponent notation or thousand separators. */
  balanceFiat: string
  /** Position groups in this app, grouped by position name */
  groups: AppPositionGroup[]
}
export type Portfolio = {
  /** Total balance in fiat currency across all tokens and positions. Decimal string without exponent notation or thousand separators. */
  totalBalanceFiat: string
  /** Total balance in fiat currency for all token holdings. Decimal string without exponent notation or thousand separators. */
  totalTokenBalanceFiat: string
  /** Total balance in fiat currency for all app positions. Decimal string without exponent notation or thousand separators. */
  totalPositionsBalanceFiat: string
  /** List of token balances */
  tokenBalances: TokenBalance[]
  /** List of app balances */
  positionBalances: AppBalance[]
}
export const {
  usePortfolioGetPortfolioV1Query,
  useLazyPortfolioGetPortfolioV1Query,
  usePortfolioClearPortfolioV1Mutation,
} = injectedRtkApi
