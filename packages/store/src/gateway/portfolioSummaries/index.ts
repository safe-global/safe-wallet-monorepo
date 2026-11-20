import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { cgwClient } from '../cgwClient'
import type {
  PortfolioClearPortfolioV1ApiArg,
  PortfolioClearPortfolioV1ApiResponse,
  PortfolioSummariesGetSummariesV2ApiArg,
  PortfolioSummariesGetSummariesV2ApiResponse,
  PortfolioSummary,
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

type CachedListsState = Parameters<typeof portfolioSummariesRtkApi.util.selectCachedArgsForQuery>[0]

const isSameSafe = (a: PortfolioSummary, b: PortfolioSummary) =>
  a.chainId === b.chainId && a.address.toLowerCase() === b.address.toLowerCase()

/**
 * Refetches the summary of the given Safes as a list of its own, then writes it into every cached list holding them:
 * that list is dropped a minute after this returns, and readers would fall back to an older list's total.
 */
export const refreshPortfolioSummary =
  (
    arg: PortfolioSummariesForManyArg,
  ): ThunkAction<
    Promise<PortfolioSummariesGetSummariesV2ApiResponse | undefined>,
    CachedListsState,
    unknown,
    UnknownAction
  > =>
  async (dispatch, getState) => {
    const query = dispatch(
      portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate(arg, { forceRefetch: true }),
    )
    // On error RTK keeps the previous data: never write that over a newer list
    const { data, isError } = await query
    query.unsubscribe()
    if (isError || !data) return undefined

    const { util } = portfolioSummariesRtkApi
    const holdsRefreshedSafe = (cached: PortfolioSummariesForManyArg) =>
      cached.currency === arg.currency &&
      cached.trusted === arg.trusted &&
      cached.safes.some((safeId) => arg.safes.includes(safeId))

    for (const cached of util.selectCachedArgsForQuery(getState(), 'portfolioGetSummariesForMany')) {
      if (!holdsRefreshedSafe(cached)) continue
      dispatch(
        util.updateQueryData('portfolioGetSummariesForMany', cached, (draft) => {
          for (const fresh of data) {
            const index = draft.findIndex((summary) => isSameSafe(summary, fresh))
            if (index !== -1) draft[index] = fresh
          }
        }),
      )
    }
    return data
  }

export const { usePortfolioGetSummariesForManyQuery, usePortfolioClearForSummaryMutation } = portfolioSummariesRtkApi
