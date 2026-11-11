import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useGetSpacePendingTransactionsQuery } from '../store/spacePendingTransactionsApi'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { usePerSafePendingTransactions } from './usePerSafePendingTransactions'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

const NO_TRANSACTIONS: never[] = []

export const useSpacePendingTransactions = (limit = 3) => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  // Chain flag that rolls out the Space queue; undefined until the chains load
  const hasSpaceQueue = useHasFeature(FEATURES.SPACE_TRANSACTIONS)
  const skipSpaceQueue = hasSpaceQueue !== true || !isUserSignedIn || !spaceId

  const spaceQueue = useGetSpacePendingTransactionsQuery(
    { spaceId: spaceId ?? '', limit },
    { skip: skipSpaceQueue, ...SPACE_REFRESH_OPTIONS },
  )
  const perSafe = usePerSafePendingTransactions(limit, hasSpaceQueue !== false)

  if (hasSpaceQueue === false) return perSafe

  const transactions = spaceQueue.currentData ?? NO_TRANSACTIONS

  return {
    transactions,
    count: transactions.length,
    isLoading: hasSpaceQueue === undefined || !spaceId || (spaceQueue.isFetching && !spaceQueue.currentData),
    error: spaceQueue.isError ? 'Failed to load pending transactions' : undefined,
    refetch: () => {
      if (!skipSpaceQueue) spaceQueue.refetch()
    },
  }
}
