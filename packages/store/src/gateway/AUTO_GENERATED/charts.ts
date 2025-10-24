import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['charts'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      chartsGetChartV1: build.query<ChartsGetChartV1ApiResponse, ChartsGetChartV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/charts/${queryArg.fungibleId}/${queryArg.period}`,
          params: {
            currency: queryArg.currency,
          },
        }),
        providesTags: ['charts'],
      }),
      chartsClearChartV1: build.mutation<ChartsClearChartV1ApiResponse, ChartsClearChartV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/charts/${queryArg.fungibleId}/${queryArg.period}`,
          method: 'DELETE',
          params: {
            currency: queryArg.currency,
          },
        }),
        invalidatesTags: ['charts'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type ChartsGetChartV1ApiResponse = /** status 200  */ Chart
export type ChartsGetChartV1ApiArg = {
  /** Asset identifier - use the assetId from portfolio endpoint (e.g., "eth", "dai", "weth-c02a") */
  fungibleId: string
  /** Time period for the chart data */
  period: 'hour' | 'day' | 'week' | 'month' | '3months' | 'year' | 'max'
  /** Fiat currency code for price conversion (e.g., usd, eur) */
  currency?: string
}
export type ChartsClearChartV1ApiResponse = unknown
export type ChartsClearChartV1ApiArg = {
  /** Fungible asset identifier */
  fungibleId: string
  /** Time period */
  period: 'hour' | 'day' | 'week' | 'month' | '3months' | 'year' | 'max'
  /** Fiat currency code */
  currency?: string
}
export type ChartStats = {
  /** First price in the period */
  first: number
  /** Minimum price in the period */
  min: number
  /** Average price in the period */
  avg: number
  /** Maximum price in the period */
  max: number
  /** Last price in the period */
  last: number
}
export type Chart = {
  /** Start timestamp of the chart period (ISO 8601) */
  beginAt: string
  /** End timestamp of the chart period (ISO 8601) */
  endAt: string
  /** Statistical summary of prices in the period */
  stats: ChartStats
  /** Array of price data points. Each point is a tuple of [timestamp (Unix seconds), price] */
  points: number[][]
}
export const { useChartsGetChartV1Query, useLazyChartsGetChartV1Query, useChartsClearChartV1Mutation } = injectedRtkApi
