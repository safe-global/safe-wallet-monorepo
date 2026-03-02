import { cgwClient } from '../cgwClient'
import { SafesGetSafeOverviewV2ApiArg, SafesGetSafeOverviewV2ApiResponse } from '../AUTO_GENERATED/safes'
import { addTagTypes } from '../AUTO_GENERATED/safes'

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

const MAX_SAFES_PER_REQUEST = 10

export const additionalSafesRtkApi = cgwClient
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      safesGetOverviewForMany: build.query<
        SafesGetSafeOverviewV2ApiResponse,
        Omit<SafesGetSafeOverviewV2ApiArg, 'safes'> & { safes: string[] }
      >({
        async queryFn(args, _api, _extraOptions, fetchWithBaseQuery) {
          const { safes, currency, trusted, walletAddress } = args
          const chunkedSafes = chunkArray(safes, MAX_SAFES_PER_REQUEST)

          let combinedData: SafesGetSafeOverviewV2ApiResponse = []

          for (const chunk of chunkedSafes) {
            const chunkArg: SafesGetSafeOverviewV2ApiArg = {
              currency,
              safes: chunk.join(','),
              trusted,
              walletAddress,
            }

            const result = await fetchWithBaseQuery({
              url: '/v2/safes',
              params: {
                currency: chunkArg.currency,
                safes: chunkArg.safes,
                trusted: chunkArg.trusted,
                wallet_address: chunkArg.walletAddress,
              },
            })

            if (result.error) {
              return { error: result.error }
            }

            combinedData = combinedData.concat(result.data as SafesGetSafeOverviewV2ApiResponse)
          }

          return { data: combinedData }
        },
        providesTags: ['safes'],
      }),
    }),
    overrideExisting: true,
  })

export const { useSafesGetOverviewForManyQuery, useLazySafesGetOverviewForManyQuery } = additionalSafesRtkApi
