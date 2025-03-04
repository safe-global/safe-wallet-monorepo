import { cgwClient } from '../cgwClient'
import { SafesGetSafeOverviewV1ApiArg, SafesGetSafeOverviewV1ApiResponse } from '../AUTO_GENERATED/safes'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { addTagTypes } from '../AUTO_GENERATED/safes'

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

const MAX_SAFES_PER_REQUEST = 10

const additionalSafesRtkApi = cgwClient
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      safesGetOverviewForMany: build.query<
        SafesGetSafeOverviewV1ApiResponse,
        Omit<SafesGetSafeOverviewV1ApiArg, 'safes'> & { safes: string[] }
      >({
        async queryFn(args, _api, _extraOptions, fetchWithBaseQuery) {
          const { safes, currency, trusted, excludeSpam, walletAddress } = args
          const chunkedSafes = chunkArray(safes, MAX_SAFES_PER_REQUEST)

          let combinedData: SafesGetSafeOverviewV1ApiResponse = []

          // Fetch each chunk
          for (const chunk of chunkedSafes) {
            const chunkArg: SafesGetSafeOverviewV1ApiArg = {
              currency,
              safes: chunk.join(','), // convert the chunk back to comma-separated
              trusted,
              excludeSpam,
              walletAddress,
            }

            // Call the same underlying URL/params as the original endpoint
            const result = await fetchWithBaseQuery({
              url: '/v1/safes',
              params: {
                currency: chunkArg.currency,
                safes: chunkArg.safes,
                trusted: chunkArg.trusted,
                exclude_spam: chunkArg.excludeSpam,
                wallet_address: chunkArg.walletAddress,
              },
            })

            if (result.error) {
              return { error: result.error as FetchBaseQueryError }
            }

            combinedData = combinedData.concat(result.data as SafesGetSafeOverviewV1ApiResponse)
          }

          return { data: combinedData }
        },
        providesTags: ['safes'],
      }),
    }),
    overrideExisting: true,
  })

export const { useSafesGetOverviewForManyQuery, useLazySafesGetOverviewForManyQuery } = additionalSafesRtkApi
