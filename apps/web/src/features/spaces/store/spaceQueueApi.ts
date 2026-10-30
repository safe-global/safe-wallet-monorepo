import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import type { SpaceQueuedItemPage, SpaceQueueSafe } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isTransactionQueuedItem } from '@/utils/transaction-guards'

export type SpaceQueueItems = SpaceQueuedItemPage['results'][string][string]
export type SpaceQueueChain = { chainId: string; items: SpaceQueueItems }
export type SpaceQueueSection = { safeAddress: string; chains: SpaceQueueChain[] }

export type SpaceQueue = {
  sections: SpaceQueueSection[]
  unavailableSafes: SpaceQueueSafe[]
  /** Transactions in `sections` */
  shownCount: number
  /** Transactions in the whole queue, more than `shownCount` when the gateway capped the pages it read */
  totalCount: number
  isComplete: boolean
}

const toSpaceQueue = (page: SpaceQueuedItemPage): SpaceQueue => {
  const sections = Object.entries(page.results).map(([safeAddress, chainItems]) => ({
    safeAddress,
    chains: Object.entries(chainItems).map(([chainId, items]) => ({ chainId, items })),
  }))
  const shownCount = sections
    .flatMap((section) => section.chains)
    .reduce((count, chain) => count + chain.items.filter(isTransactionQueuedItem).length, 0)
  const totalCount = Math.max(page.count ?? shownCount, shownCount)

  return {
    sections,
    unavailableSafes: page.unavailableSafes,
    shownCount,
    totalCount,
    isComplete: shownCount >= totalCount,
  }
}

// Built on cgwClient, not the generated spaces api, which many tests replace with a partial mock
export const spaceQueueApi = cgwClient.enhanceEndpoints({ addTagTypes: ['transactions'] }).injectEndpoints({
  endpoints: (build) => ({
    getSpaceQueue: build.query<SpaceQueue, { spaceId: string }>({
      query: ({ spaceId }) => ({ url: `/v1/spaces/${spaceId}/transactions/queued` }),
      transformResponse: toSpaceQueue,
      providesTags: ['transactions'],
    }),
  }),
})

export const { useGetSpaceQueueQuery } = spaceQueueApi
