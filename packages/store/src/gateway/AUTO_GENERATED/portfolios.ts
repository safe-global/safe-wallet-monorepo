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
            provider: queryArg.provider,
          },
        }),
        providesTags: ['portfolio'],
      }),
      portfolioClearPortfolioV1: build.mutation<PortfolioClearPortfolioV1ApiResponse, PortfolioClearPortfolioV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/portfolio/${queryArg.address}`, method: 'DELETE' }),
        invalidatesTags: ['portfolio'],
      }),
      portfolioGetWalletChartV1: build.query<PortfolioGetWalletChartV1ApiResponse, PortfolioGetWalletChartV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/portfolio/${queryArg.address}/chart/${queryArg.period}`,
          params: {
            currency: queryArg.currency,
          },
        }),
        providesTags: ['portfolio'],
      }),
      portfolioClearWalletChartV1: build.mutation<
        PortfolioClearWalletChartV1ApiResponse,
        PortfolioClearWalletChartV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/portfolio/${queryArg.address}/chart/${queryArg.period}`,
          method: 'DELETE',
          params: {
            currency: queryArg.currency,
          },
        }),
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
  /** If true, filters out dust positions (balance < $1 USD) */
  excludeDust?: boolean
  /** Portfolio data provider */
  provider?: 'zerion' | 'zapper'
}
export type PortfolioClearPortfolioV1ApiResponse = unknown
export type PortfolioClearPortfolioV1ApiArg = {
  /** Wallet address (0x prefixed hex string) */
  address: string
}
export type PortfolioGetWalletChartV1ApiResponse = /** status 200  */ WalletChart
export type PortfolioGetWalletChartV1ApiArg = {
  /** Wallet address (0x prefixed hex string) */
  address: string
  /** Time period for the chart data */
  period: 'hour' | 'day' | 'week' | 'month' | '3months' | 'year' | 'max'
  /** Fiat currency code for value conversion (e.g., USD, EUR) */
  currency?: string
}
export type PortfolioClearWalletChartV1ApiResponse = unknown
export type PortfolioClearWalletChartV1ApiArg = {
  /** Wallet address (0x prefixed hex string) */
  address: string
  /** Time period */
  period: 'hour' | 'day' | 'week' | 'month' | '3months' | 'year' | 'max'
  /** Fiat currency code */
  currency?: string
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
  /** Token logo URI (HTTPS) */
  logoUri: string
  /** Chain ID where token is deployed */
  chainId: string
  /** Whether the token is verified by the provider */
  trusted: boolean
  /** Unique asset identifier (human-readable slug like "eth", "dai", "weth-c02a") */
  assetId: string
  /** Token type */
  type: 'ERC20' | 'NATIVE_TOKEN'
}
export type TokenBalance = {
  /** Token information */
  tokenInfo: TokenBalanceTokenInfo
  /** Token balance (as string to avoid precision loss) */
  balance: string
  /** Balance in requested fiat currency */
  balanceFiat?: number | null
  /** Token price in requested fiat currency */
  price?: number | null
  /** Price change as decimal (e.g., -0.0431 for -4.31%) */
  priceChangePercentage1d?: number | null
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
  /** Token logo URI (HTTPS) */
  logoUri: string
  /** Chain ID where token is deployed */
  chainId: string
  /** Whether the token is verified by the provider */
  trusted: boolean
  /** Unique asset identifier (human-readable slug like "eth", "dai", "weth-c02a") */
  assetId: string
  /** Token type (positions are always ERC20) */
  type: 'ERC20'
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
  /** Balance in requested fiat currency */
  balanceFiat?: number | null
  /** Price change as decimal (e.g., -0.0431 for -4.31%) */
  priceChangePercentage1d?: number | null
}
export type AppBalance = {
  /** Application information */
  appInfo: AppBalanceAppInfo
  /** Total balance in fiat currency across all positions */
  balanceFiat?: number | null
  /** List of positions in this app */
  positions: AppPosition[]
}
export type PnL = {
  /** Realized Gain. The gain (or loss) realized from the sale of fungible assets, calculated using the FIFO (First In, First Out) method. The cost basis of the oldest assets is subtracted from the sale proceeds. */
  realizedGain: number
  /** Unrealized Gain. The potential gain (or loss) on unsold fungible assets, calculated as the difference between their current market value and cost basis using the FIFO method. */
  unrealizedGain: number
  /** Total Fees Paid. The sum of all transaction fees associated with asset trades. */
  totalFee: number
  /** Net Invested Amount. The total amount invested in fungible assets that have not been sold, calculated using the FIFO method. */
  netInvested: number
  /** Received Amount from Other Wallets. The cumulative value of all fungible assets received from other wallets. Note: This value does not include amounts traded internally within the wallet but does include received_for_nfts. */
  receivedExternal: number
  /** Sent Amount to Other Wallets. The cumulative value of all fungible assets sent to other wallets. Note: This value does not include amounts traded internally within the wallet but does include sent_for_nfts. */
  sentExternal: number
  /** Sent Amount for NFTs. The cumulative value of all fungible assets sent in transactions where the wallet receives NFTs. */
  sentForNfts: number
  /** Received Amount for NFTs. The cumulative value of all fungible assets received in transactions where the wallet sends NFTs. */
  receivedForNfts: number
}
export type Portfolio = {
  /** Total balance in fiat currency across all tokens and positions */
  totalBalanceFiat: number
  /** Total balance in fiat currency for all token holdings */
  totalTokenBalanceFiat: number
  /** Total balance in fiat currency for all app positions */
  totalPositionsBalanceFiat: number
  /** List of token balances */
  tokenBalances: TokenBalance[]
  /** List of app balances */
  positionBalances: AppBalance[]
  /** Profit and Loss metrics (null if unavailable) */
  pnl?: PnL | null
}
export type WalletChart = {
  /** Start timestamp of the chart period (ISO 8601) */
  beginAt: string
  /** End timestamp of the chart period (ISO 8601) */
  endAt: string
  /** Array of portfolio value data points. Each point is a tuple of [timestamp (Unix seconds), value in fiat currency] */
  points: number[][]
}
export const {
  usePortfolioGetPortfolioV1Query,
  useLazyPortfolioGetPortfolioV1Query,
  usePortfolioClearPortfolioV1Mutation,
  usePortfolioGetWalletChartV1Query,
  useLazyPortfolioGetWalletChartV1Query,
  usePortfolioClearWalletChartV1Mutation,
} = injectedRtkApi
