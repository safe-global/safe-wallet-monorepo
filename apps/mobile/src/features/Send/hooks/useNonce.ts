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

type QueuedItem = QueuedItemPage['results'][number]

interface UseNonceResult {
  recommendedNonce: number | undefined
  currentNonce: number | undefined
  queuedNonces: QueuedNonceItem[]
  isLoading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  fetchMore: () => void
}

function flattenPages(pages: QueuedItemPage[] | undefined): QueuedItem[] {
  if (!pages) {
    return []
  }
  return pages.flatMap((page) => page.results || [])
}

function resolveTransactionNonce(txItem: TransactionQueuedItem, fallbackNonce: number | undefined): number | undefined {
  const { executionInfo } = txItem.transaction
  if (executionInfo?.type === 'MULTISIG') {
    return executionInfo.nonce
  }
  return fallbackNonce
}

function buildQueuedNonceItem(txItem: TransactionQueuedItem, nonce: number): QueuedNonceItem {
  return { nonce, label: extractTxLabel(txItem.transaction.txInfo) }
}

function collectQueuedNonces(items: QueuedItem[]): QueuedNonceItem[] {
  const result: QueuedNonceItem[] = []
  let conflictNonce: number | undefined

  for (const item of items) {
    if (item.type === 'CONFLICT_HEADER') {
      conflictNonce = (item as ConflictHeaderQueuedItem).nonce
      continue
    }

    if (item.type !== 'TRANSACTION') {
      continue
    }

    const txItem = item as TransactionQueuedItem
    const nonce = resolveTransactionNonce(txItem, conflictNonce)

    if (nonce === undefined) {
      continue
    }

    if (!result.some((existing) => existing.nonce === nonce)) {
      result.push(buildQueuedNonceItem(txItem, nonce))
    }
  }

  return result.sort((a, b) => b.nonce - a.nonce)
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

  const allItems = useMemo(() => flattenPages(currentData?.pages), [currentData?.pages])

  const queuedNonces = useMemo(() => collectQueuedNonces(allItems), [allItems])

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
