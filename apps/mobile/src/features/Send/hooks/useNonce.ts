import { useCallback, useMemo } from 'react'
import { useSafesGetNoncesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useGetPendingTxsInfiniteQuery } from '@safe-global/store/gateway'
import type {
  ConflictHeaderQueuedItem,
  QueuedItemPage,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTransactionType } from '@/src/hooks/useTransactionType'

export interface QueuedNonceItem {
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

export function flattenPages(pages: QueuedItemPage[] | undefined): QueuedItem[] {
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
  return { nonce, label: extractTxLabel(txItem) }
}

export function collectQueuedNonces(items: QueuedItem[]): QueuedNonceItem[] {
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

  return result.sort((a, b) => a.nonce - b.nonce)
}

function deriveLoadingState(
  isNoncesLoading: boolean,
  isQueueLoading: boolean,
  isFetching: boolean,
  hasNextPage: boolean | undefined,
) {
  return {
    isLoading: isNoncesLoading || isQueueLoading,
    isFetchingMore: isFetching && !isQueueLoading,
    hasMore: Boolean(hasNextPage),
  }
}

export function useNonce(chainId: string, safeAddress: string): UseNonceResult {
  const { data: noncesData, isLoading: isNoncesLoading } = useSafesGetNoncesV1Query(
    { chainId, safeAddress },
    { refetchOnMountOrArgChange: true },
  )

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

  const loadingState = deriveLoadingState(isNoncesLoading, isQueueLoading, isFetching, hasNextPage)

  return {
    recommendedNonce: noncesData?.recommendedNonce,
    currentNonce: noncesData?.currentNonce,
    queuedNonces,
    fetchMore,
    ...loadingState,
  }
}

function extractTxLabel(txItem: TransactionQueuedItem): string {
  const { transaction } = txItem
  const txInfo = transaction.txInfo as { humanDescription?: string | null }
  if (txInfo.humanDescription) {
    return txInfo.humanDescription
  }
  const { text } = getTransactionType(transaction)
  if (text.toLowerCase().endsWith('transaction')) {
    return text
  }
  return `${text} transaction`
}
