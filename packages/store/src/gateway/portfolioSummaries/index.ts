import { cgwClient } from '../cgwClient'
import {
  addTagTypes,
  type PortfolioSummariesGetSummariesV2ApiArg,
  type PortfolioSummariesGetSummariesV2ApiResponse,
} from '../AUTO_GENERATED/portfolios'
import { chunkArray, MAX_SAFES_PER_REQUEST } from '../chunkArray'

export const PORTFOLIO_SUMMARY_TAG = 'PortfolioSummary'

/** Tag id of one Safe's summary. Lowercased so a checksummed and a lowercase address invalidate the same entry. */
export const makePortfolioSummaryTag = (chainId: string, address: string): string =>
  `${chainId}:${address.toLowerCase()}`

export type PortfolioSummariesForManyArg = Omit<PortfolioSummariesGetSummariesV2ApiArg, 'safes' | 'trusted'> & {
  /** Safes in chainId:address format */
  safes: string[]
  // Required: CGW defaults to true, and a request whose value differs from /v1/portfolio reads another Zerion snapshot
  trusted: boolean
}

export const portfolioSummariesRtkApi = cgwClient
  .enhanceEndpoints({
    addTagTypes: [...addTagTypes, PORTFOLIO_SUMMARY_TAG],
  })
  .injectEndpoints({
    endpoints: (build) => ({
      portfolioGetSummariesForMany: build.query<
        PortfolioSummariesGetSummariesV2ApiResponse,
        PortfolioSummariesForManyArg
      >({
        async queryFn({ safes, currency, trusted }, _api, _extraOptions, fetchWithBaseQuery) {
          let combinedData: PortfolioSummariesGetSummariesV2ApiResponse = []

          for (const chunk of chunkArray(safes, MAX_SAFES_PER_REQUEST)) {
            const result = await fetchWithBaseQuery({
              url: '/v2/portfolio/summaries',
              params: { safes: chunk.join(','), currency, trusted },
            })

            if (result.error) {
              return { error: result.error }
            }

            combinedData = combinedData.concat(result.data as PortfolioSummariesGetSummariesV2ApiResponse)
          }

          return { data: combinedData }
        },
        // `portfolio` refetches after DELETE /v1/portfolio; the per-Safe tags let a refresh target one Safe
        providesTags: (_result, _error, { safes }) => [
          'portfolio' as const,
          ...safes.map((safe) => {
            const [chainId, address] = safe.split(':')
            return { type: PORTFOLIO_SUMMARY_TAG, id: makePortfolioSummaryTag(chainId, address) } as const
          }),
        ],
      }),
    }),
    overrideExisting: true,
  })

export const { usePortfolioGetSummariesForManyQuery } = portfolioSummariesRtkApi
