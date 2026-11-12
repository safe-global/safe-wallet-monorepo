import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { cgwClient } from '../cgwClient'
import type {
  PortfolioClearPortfolioV1ApiArg,
  PortfolioClearPortfolioV1ApiResponse,
  PortfolioSummariesGetSummariesV2ApiArg,
  PortfolioSummariesGetSummariesV2ApiResponse,
} from '../AUTO_GENERATED/portfolios'
import { chunkArray, MAX_SAFES_PER_REQUEST } from '../chunkArray'

export type PortfolioSummariesForManyArg = Omit<PortfolioSummariesGetSummariesV2ApiArg, 'safes' | 'trusted'> & {
  /** Safes in chainId:address format */
  safes: string[]
  // Required: CGW defaults to true, and a request whose value differs from /v1/portfolio reads another Zerion snapshot
  trusted: boolean
}

export const portfolioSummariesRtkApi = cgwClient.injectEndpoints({
  endpoints: (build) => ({
    portfolioGetSummariesForMany: build.query<
      PortfolioSummariesGetSummariesV2ApiResponse,
      PortfolioSummariesForManyArg
    >({
      // Keeps the batches that succeeded: a Safe missing from the result falls back to its previous source
      async queryFn({ safes, currency, trusted }, _api, _extraOptions, fetchWithBaseQuery) {
        let combinedData: PortfolioSummariesGetSummariesV2ApiResponse = []
        let firstError: FetchBaseQueryError | undefined
        let succeededBatches = 0

        for (const chunk of chunkArray(safes, MAX_SAFES_PER_REQUEST)) {
          const result = await fetchWithBaseQuery({
            url: '/v2/portfolio/summaries',
            params: { safes: chunk.join(','), currency, trusted },
          })

          if (result.error) {
            firstError ??= result.error
            continue
          }

          succeededBatches += 1
          combinedData = combinedData.concat(result.data as PortfolioSummariesGetSummariesV2ApiResponse)
        }

        return succeededBatches === 0 && firstError ? { error: firstError } : { data: combinedData }
      },
    }),
    // The generated DELETE invalidates every `portfolio` query; callers refresh only the Safe they cleared
    portfolioClearForSummary: build.mutation<PortfolioClearPortfolioV1ApiResponse, PortfolioClearPortfolioV1ApiArg>({
      query: ({ address, chainId }) => ({ url: `/v1/portfolio/${address}`, method: 'DELETE', params: { chainId } }),
    }),
  }),
  overrideExisting: true,
})

/** Refetches the summary of the given Safes as a list of its own; readers pick the newest summary of each Safe. */
export const refreshPortfolioSummary =
  (arg: PortfolioSummariesForManyArg): ThunkAction<Promise<void>, unknown, unknown, UnknownAction> =>
  async (dispatch) => {
    const query = dispatch(
      portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate(arg, { forceRefetch: true }),
    )
    await query
    query.unsubscribe()
  }

export const { usePortfolioGetSummariesForManyQuery, usePortfolioClearForSummaryMutation } = portfolioSummariesRtkApi
