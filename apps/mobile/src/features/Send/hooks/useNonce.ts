import { useCallback, useMemo } from 'react'
import { useSafesGetNoncesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useGetPendingTxsInfiniteQuery } from '@safe-global/store/gateway'
import type {
  ConflictHeaderQueuedItem,
  QueuedItemPage,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface QueuedNonceItem {
  nonce: number
  label: string
}

interface UseNonceResult {
  recommendedNonce: number | undefined
  currentNonce: number | undefined
  queuedNonces: QueuedNonceItem[]
  isLoading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  fetchMore: () => void
}

export function useNonce(chainId: string, safeAddress: string): UseNonceResult {
  const { data: noncesData, isLoading: isNoncesLoading } = useSafesGetNoncesV1Query({
    chainId,
    safeAddress,
  })

  const {
    currentData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading: isQueueLoading,
  } = useGetPendingTxsInfiniteQuery({
    chainId,
    safeAddress,
    trusted: true,
  })

  const allItems = useMemo(() => {
    if (!currentData?.pages) {
      return []
    }
    return currentData.pages.flatMap((page: QueuedItemPage) => page.results || [])
  }, [currentData?.pages])

  const queuedNonces = useMemo(() => {
    if (allItems.length === 0) {
      return []
    }

    const items: QueuedNonceItem[] = []
    let currentNonce: number | undefined

    for (const item of allItems) {
      if (item.type === 'CONFLICT_HEADER') {
        currentNonce = (item as ConflictHeaderQueuedItem).nonce
        continue
      }

      if (item.type === 'TRANSACTION') {
        const txItem = item as TransactionQueuedItem
        const tx = txItem.transaction
        const nonce =
          tx.executionInfo?.type === 'MULTISIG'
            ? tx.executionInfo.nonce
            : currentNonce

        if (nonce === undefined) {
          continue
        }

        const label = extractTxLabel(tx.txInfo)
        if (!items.some((existing) => existing.nonce === nonce)) {
          items.push({ nonce, label })
        }
      }
    }

    return items.sort((a, b) => b.nonce - a.nonce)
  }, [allItems])

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetching, fetchNextPage])

  return {
    recommendedNonce: noncesData?.recommendedNonce,
    currentNonce: noncesData?.currentNonce,
    queuedNonces,
    isLoading: isNoncesLoading || isQueueLoading,
    isFetchingMore: isFetching && !isQueueLoading,
    hasMore: !!hasNextPage,
    fetchMore,
  }
}

function extractTxLabel(
  txInfo: {
    type: string
    methodName?: string | null
    humanDescription?: string | null
  } & Record<string, unknown>,
): string {
  switch (txInfo.type) {
    case 'Transfer':
      return 'Send transaction'
    case 'SettingsChange':
      return 'Settings change'
    case 'Custom':
      return (txInfo.methodName as string) ?? 'Contract interaction'
    case 'MultiSend':
      return 'Batch transaction'
    default:
      return txInfo.humanDescription ?? 'Transaction'
  }
}
