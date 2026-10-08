import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement, useEffect, useState, useCallback, useRef } from 'react'
import TxList from '@/components/transactions/TxList'
import ErrorMessage from '@/components/tx/ErrorMessage'
import type useTxHistory from '@/hooks/useTxHistory'
import useTxQueue from '@/hooks/useTxQueue'
import InfiniteScroll from '../InfiniteScroll'
import { useTxFilter } from '@/utils/tx-history-filter'
import { isTransactionListItem } from '@/utils/transaction-guards'
import { useHasPendingTxs } from '@/hooks/usePendingTxs'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useRecoveryQueue } from '@/features/recovery'
import { isSamePage } from '@/utils/tx-list'
import { PaginatedTxnsView, TxPageView } from '@views/components/common/PaginatedTxns/PaginatedTxnsView'

const TxPage = ({
  pageUrl,
  useTxns,
  onNextPage,
  isFirstPage,
  onPageLoaded,
}: {
  pageUrl: string
  useTxns: typeof useTxHistory | typeof useTxQueue
  onNextPage?: (pageUrl: string) => void
  isFirstPage: boolean
  onPageLoaded: (page: QueuedItemPage) => void
}): ReactElement => {
  const { page, error, loading } = useTxns(pageUrl)
  const [filter] = useTxFilter()
  const isQueue = useTxns === useTxQueue
  const recoveryQueue = useRecoveryQueue()
  const hasPending = useHasPendingTxs()

  const lastPageRef = useRef<QueuedItemPage>(undefined)

  useEffect(() => {
    if (page && (!lastPageRef.current || !isSamePage(page, lastPageRef.current))) {
      lastPageRef.current = page as QueuedItemPage
      onPageLoaded(page as QueuedItemPage)
    }
  }, [page, onPageLoaded])

  return (
    <TxPageView
      filterResult={
        isFirstPage && filter && page
          ? { type: filter.type, count: page.results.filter(isTransactionListItem).length, hasMore: !!page.next }
          : undefined
      }
      txList={page && page.results.length > 0 && <TxList items={page.results} />}
      showNoQueued={isQueue && page?.results.length === 0 && recoveryQueue.length === 0 && !hasPending}
      hasError={!!error}
      renderErrorMessage={(message) => <ErrorMessage>{message}</ErrorMessage>}
      showSkeleton={loading && !hasPending && (!page || page.results.length === 0)}
      loadMore={page?.next && onNextPage && <InfiniteScroll onLoadMore={() => onNextPage(page.next!)} />}
    />
  )
}

const PaginatedTxns = ({
  useTxns,
  onPagesChange,
}: {
  useTxns: typeof useTxHistory | typeof useTxQueue
  onPagesChange?: (pages: QueuedItemPage[]) => void
}): ReactElement => {
  const [pages, setPages] = useState<string[]>([''])
  const [filter] = useTxFilter()
  const { safeAddress, safe } = useSafeInfo()
  const [loadedPages, setLoadedPages] = useState<Map<string, QueuedItemPage>>(new Map())
  const lastPageItemsRef = useRef<QueuedItemPage[]>([])

  // Reset the pages when the Safe account or filter changes
  useEffect(() => {
    setPages([''])
  }, [filter, safe.chainId, safeAddress, useTxns])

  // Trigger the next page load
  const onNextPage = (pageUrl: string) => {
    setPages((prev) => prev.concat(pageUrl))
  }

  // Handle page loaded callback - memoized to prevent infinite loops
  const handlePageLoaded = useCallback(
    (pageUrl: string) => (page: QueuedItemPage) => {
      setLoadedPages((prev) => {
        const currentPage = prev.get(pageUrl)
        // Only update if the page actually changed
        if (currentPage && isSamePage(currentPage, page)) {
          return prev
        }
        const updated = new Map(prev)
        updated.set(pageUrl, page)
        return updated
      })
    },
    [],
  )

  // Notify parent when pages change
  useEffect(() => {
    const pageItems = pages.map((url) => loadedPages.get(url)).filter((item) => !!item)

    if (
      pageItems.length !== lastPageItemsRef.current.length ||
      pageItems.some((item, index) => !isSamePage(item, lastPageItemsRef.current[index]))
    ) {
      onPagesChange?.(pageItems)
      lastPageItemsRef.current = pageItems
    }
  }, [pages, loadedPages, onPagesChange])

  return (
    <PaginatedTxnsView>
      {pages.map((pageUrl, index) => (
        <TxPage
          key={pageUrl}
          pageUrl={pageUrl}
          useTxns={useTxns}
          isFirstPage={index === 0}
          onNextPage={index === pages.length - 1 ? onNextPage : undefined}
          onPageLoaded={handlePageLoaded(pageUrl)}
        />
      ))}
    </PaginatedTxnsView>
  )
}

export default PaginatedTxns
