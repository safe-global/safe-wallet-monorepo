import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getLatestTransactions } from '@/utils/tx-list'

export type SpacePendingTxItem = TransactionQueuedItem & { safeAddress: string; chainId: string }

type SpacePendingTransactionsArgs = { spaceId: string; limit: number }

// The gateway does not honour `limit` yet, so it is applied here too
export const toSpacePendingTransactions = (page: SpaceQueuedItemPage, limit: number): SpacePendingTxItem[] =>
  Object.entries(page.results)
    .flatMap(([safeAddress, chainItems]) =>
      Object.entries(chainItems).flatMap(([chainId, items]) =>
        getLatestTransactions(items).map((tx) => ({ ...tx, safeAddress, chainId })),
      ),
    )
    .sort((a, b) => a.transaction.timestamp - b.transaction.timestamp)
    .slice(0, limit)

// The generated space queue endpoint takes no `limit`, so the widget gets its own
export const spacePendingTransactionsApi = cgwClient
  .enhanceEndpoints({ addTagTypes: ['transactions'] })
  .injectEndpoints({
    endpoints: (build) => ({
      getSpacePendingTransactions: build.query<SpacePendingTxItem[], SpacePendingTransactionsArgs>({
        query: ({ spaceId, limit }) => ({
          url: `/v1/spaces/${spaceId}/transactions/queued`,
          params: { limit },
        }),
        transformResponse: (page: SpaceQueuedItemPage, _meta, { limit }) => toSpacePendingTransactions(page, limit),
        providesTags: ['transactions'],
      }),
    }),
  })

export const { useGetSpacePendingTransactionsQuery } = spacePendingTransactionsApi
