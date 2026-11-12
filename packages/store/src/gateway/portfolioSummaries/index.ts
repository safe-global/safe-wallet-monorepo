import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
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

export const { usePortfolioGetSummariesForManyQuery } = portfolioSummariesRtkApi
