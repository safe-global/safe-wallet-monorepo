import { useMemo } from 'react'
import { useSpaceTransactionsGetTransactionQueueV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { getLatestTransactions } from '@/utils/tx-list'
import { useCurrentSpaceId } from '../public/hooks/useCurrentSpaceId'
import { usePerSafePendingTransactions, type SpacePendingTxItem } from './usePerSafePendingTransactions'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

const NO_TRANSACTIONS: SpacePendingTxItem[] = []

export const useSpacePendingTransactions = (limit = 3) => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  // Chain flag that rolls out the Space queue; undefined until the chains load
  const hasSpaceQueue = useHasFeature(FEATURES.SPACE_TRANSACTIONS)
  const skipSpaceQueue = hasSpaceQueue !== true || !isUserSignedIn || !spaceId

  // No `limit`: the gateway would cut the queue by nonce, not by age
  const spaceQueue = useSpaceTransactionsGetTransactionQueueV1Query(
    { spaceId: spaceId ?? '' },
    { skip: skipSpaceQueue, ...SPACE_REFRESH_OPTIONS },
  )
  const perSafe = usePerSafePendingTransactions(limit, hasSpaceQueue !== false)

  const page = spaceQueue.currentData
  const transactions = useMemo<SpacePendingTxItem[]>(() => {
    if (!page) return NO_TRANSACTIONS

    return Object.entries(page.results)
      .flatMap(([safeAddress, chainItems]) =>
        Object.entries(chainItems).flatMap(([chainId, items]) =>
          getLatestTransactions(items).map((tx) => ({ ...tx, safeAddress, chainId })),
        ),
      )
      .sort((a, b) => a.transaction.timestamp - b.transaction.timestamp)
      .slice(0, limit)
  }, [page, limit])

  if (hasSpaceQueue === false) return perSafe

  return {
    transactions,
    count: transactions.length,
    isLoading: hasSpaceQueue === undefined || !spaceId || (spaceQueue.isFetching && !page),
    error: spaceQueue.isError ? 'Failed to load pending transactions' : undefined,
    refetch: () => {
      if (!skipSpaceQueue) spaceQueue.refetch()
    },
  }
}
