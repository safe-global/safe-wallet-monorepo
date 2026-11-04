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
            sync: queryArg.sync,
            excludeDust: queryArg.excludeDust,
            trusted: queryArg.trusted,
            chainIds: queryArg.chainIds,
            fiatCode: queryArg.fiatCode,
          },
        }),
        providesTags: ['portfolio'],
      }),
      portfolioClearPortfolioV1: build.mutation<PortfolioClearPortfolioV1ApiResponse, PortfolioClearPortfolioV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/portfolio/${queryArg.address}`,
          method: 'DELETE',
          params: {
            chainId: queryArg.chainId,
          },
        }),
        invalidatesTags: ['portfolio'],
      }),
      portfolioSummariesGetSummariesV2: build.query<
        PortfolioSummariesGetSummariesV2ApiResponse,
        PortfolioSummariesGetSummariesV2ApiArg
      >({
        query: (queryArg) => ({
          url: `/v2/portfolio/summaries`,
          params: {
            safes: queryArg.safes,
            currency: queryArg.currency,
            trusted: queryArg.trusted,
          },
        }),
        providesTags: ['portfolio'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type PortfolioGetPortfolioV1ApiResponse = /** status 200  */ Portfolio
export type PortfolioGetPortfolioV1ApiArg = {
  /** Wallet address (0x prefixed hex string) */
  address: string
  /** If true, waits for position data to be aggregated before responding (up to 30s) */
  sync?: boolean
  /** If true, filters out dust positions (balance < $0.001 USD) */
  excludeDust?: boolean
  /** If true, only returns trusted tokens */
  trusted?: boolean
  /** Comma-separated list of chain IDs to filter by. If omitted, returns data for all chains. */
  chainIds?: string
  /** Fiat currency code for balance conversion (e.g., USD, EUR) */
  fiatCode?: string
}
export type PortfolioClearPortfolioV1ApiResponse = unknown
export type PortfolioClearPortfolioV1ApiArg = {
  /** Safe address (0x prefixed hex string) */
  address: string
  /** A chain on which the address is a Safe */
  chainId: string
}
export type PortfolioSummariesGetSummariesV2ApiResponse = /** status 200  */ PortfolioSummary[]
export type PortfolioSummariesGetSummariesV2ApiArg = {
  /** Comma-separated list of Safe addresses in chainId:address format. Only the first MAX_SAFE_OVERVIEWS distinct entries are used. */
  safes: string
  /** Fiat currency code (e.g. USD, EUR) */
  currency: string
  /** If true, only trusted tokens count. Defaults to false. */
  trusted?: boolean
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
export type PortfolioSummarySnapshot = {
  /** Total across every chain of this address in this environment (mainnets or testnets). Decimal string. */
  fiatTotal: string
  /** Absolute change of the total over 1 day. Decimal string, null when Zerion has no history. */
  fiatChange1d: string | null
  /** Percentage change of the total over 1 day, null when Zerion has no history. */
  percentChange1d: number | null
  /** Total per chain, keyed by chainId. Only chains whose Zerion network maps to a chainId are listed, so the values may not add up to fiatTotal. */
  fiatTotalByChain: {
    [key: string]: string
  }
  /** Total per position type as returned by Zerion (e.g. wallet, deposited, borrowed, locked, staked). */
  fiatTotalByType: {
    [key: string]: string
  }
  /** When the snapshot was fetched from Zerion. */
  updatedAt: string
  /** When the cached snapshot expires. A transaction or a manual refresh can clear it earlier. */
  expiresAt: string
}
export type PortfolioSummary = {
  chainId: string
  address: string
  /** Value of this Safe on this chain. Decimal string. */
  fiatTotal: string
  /** zerion: read from the Zerion snapshot. tx_service: the chain is not on Zerion, or the snapshot is unavailable. */
  source: 'zerion' | 'tx_service'
  /** The Zerion snapshot the value was read from, null for tx_service. */
  snapshot: PortfolioSummarySnapshot | null
}
export const {
  usePortfolioGetPortfolioV1Query,
  useLazyPortfolioGetPortfolioV1Query,
  usePortfolioClearPortfolioV1Mutation,
  usePortfolioSummariesGetSummariesV2Query,
  useLazyPortfolioSummariesGetSummariesV2Query,
} = injectedRtkApi
