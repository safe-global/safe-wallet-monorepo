import { cgwClient } from '../cgwClient'
import {
  addTagTypes,
  type PortfolioSummariesGetSummariesV2ApiArg,
  type PortfolioSummariesGetSummariesV2ApiResponse,
} from '../AUTO_GENERATED/portfolios'
import { chunkArray, MAX_SAFES_PER_REQUEST } from '../chunkArray'

export const portfolioSummariesRtkApi = cgwClient
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      portfolioGetSummariesForMany: build.query<
        PortfolioSummariesGetSummariesV2ApiResponse,
        Omit<PortfolioSummariesGetSummariesV2ApiArg, 'safes'> & { safes: string[] }
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
        // Shares the tag of DELETE /v1/portfolio, which clears the snapshot these summaries read
        providesTags: ['portfolio'],
      }),
    }),
    overrideExisting: true,
  })

export const { usePortfolioGetSummariesForManyQuery } = portfolioSummariesRtkApi
