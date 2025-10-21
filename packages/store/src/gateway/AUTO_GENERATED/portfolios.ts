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
          url: `/v1/portfolios/${queryArg.address}`,
          params: {
            fiatCode: queryArg.fiatCode,
            chainIds: queryArg.chainIds,
            trusted: queryArg.trusted,
            excludeDust: queryArg.excludeDust,
            provider: queryArg.provider,
          },
        }),
        providesTags: ['portfolio'],
      }),
      portfolioClearPortfolioV1: build.mutation<PortfolioClearPortfolioV1ApiResponse, PortfolioClearPortfolioV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/portfolios/${queryArg.address}`, method: 'DELETE' }),
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
  /** Comma-separated list of chain IDs to filter by */
  chainIds?: string
  /** If true, only returns trusted tokens */
  trusted?: boolean
  /** If true, filters out dust positions (balance < $1 USD) */
  excludeDust?: boolean
  /** Portfolio data provider (zerion or zapper) */
  provider?: string
}
export type PortfolioClearPortfolioV1ApiResponse = unknown
export type PortfolioClearPortfolioV1ApiArg = {
  /** Wallet address (0x prefixed hex string) */
  address: string
}
export type TokenBalanceTokenInfo = {
  /** Token contract address (0x0000000000000000000000000000000000000000 for native tokens) */
  address: string
  /** Token decimals */
  decimals: number
  /** Token symbol */
  symbol: string
  /** Token name */
  name: string
  /** Token logo URL (HTTPS) */
  logoUrl?: string | null
  /** Chain ID where token is deployed */
  chainId: string
}
export type TokenBalance = {
  /** Token information */
  tokenInfo: TokenBalanceTokenInfo
  /** Token balance (as string to avoid precision loss) */
  balance: string
  /** Balance in requested fiat currency (decimal string) */
  balanceFiat?: string | null
  /** Token price in requested fiat currency (decimal string) */
  price?: string | null
  /** Price change percentage in the last 24 hours (decimal string) */
  priceChangePercentage1d?: string | null
}
export type AppBalanceAppInfo = {
  /** Application name */
  name: string
  /** Application logo URL (HTTPS) */
  logoUrl?: string | null
  /** Application URL (HTTPS) */
  url?: string | null
}
export type AppPositionTokenInfo = {
  /** Token contract address (0x0000000000000000000000000000000000000000 for native tokens) */
  address: string
  /** Token decimals */
  decimals: number
  /** Token symbol */
  symbol: string
  /** Token name */
  name: string
  /** Token logo URL (HTTPS) */
  logoUrl?: string | null
  /** Chain ID where token is deployed */
  chainId: string
}
export type AppPosition = {
  /** Unique position key */
  key: string
  /** Position type (e.g., staked, lending, liquidity) */
  type: string
  /** Position name */
  name: string
  /** Token information */
  tokenInfo: AppPositionTokenInfo
  /** Position balance */
  balance: string
  /** Balance in requested fiat currency (decimal string) */
  balanceFiat?: string | null
  /** Price change percentage in the last 24 hours (decimal string) */
  priceChangePercentage1d?: string | null
}
export type AppBalance = {
  /** Application information */
  appInfo: AppBalanceAppInfo
  /** Total balance in fiat currency across all positions (decimal string) */
  balanceFiat?: string | null
  /** List of positions in this app */
  positions: AppPosition[]
}
export type Portfolio = {
  /** Total balance in fiat currency across all tokens and positions */
  totalBalanceFiat: string
  /** Total balance in fiat currency for all token holdings */
  totalTokenBalanceFiat: string
  /** Total balance in fiat currency for all app positions */
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
