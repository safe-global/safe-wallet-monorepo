import type { TransactionItemPage, QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement, useEffect, useState, useCallback, useRef } from 'react'
import { Box } from '@mui/material'
import TxList from '@/components/transactions/TxList'
import ErrorMessage from '@/components/tx/ErrorMessage'
import type useTxHistory from '@/hooks/useTxHistory'
import useTxQueue from '@/hooks/useTxQueue'
import PagePlaceholder from '../PagePlaceholder'
import InfiniteScroll from '../InfiniteScroll'
import SkeletonTxList from './SkeletonTxList'
import { type TxFilter, useTxFilter } from '@/utils/tx-history-filter'
import { isTransactionListItem } from '@/utils/transaction-guards'
import NoTransactionsIcon from '@/public/images/transactions/no-transactions.svg'
import { useHasPendingTxs } from '@/hooks/usePendingTxs'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useRecoveryQueue } from '@/features/recovery/hooks/useRecoveryQueue'
import { isSamePage } from '@/utils/tx-list'

const NoQueuedTxns = () => {
  return <PagePlaceholder img={<NoTransactionsIcon />} text="Queued transactions will appear here" />
}

const getFilterResultCount = (filter: TxFilter, page: TransactionItemPage | QueuedItemPage) => {
  const count = page.results.filter(isTransactionListItem).length

  return `${page.next ? '> ' : ''}${count} ${filter.type} transactions found`.toLowerCase()
}

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
    <>
      {isFirstPage && filter && page && (
        <Box display="flex" flexDirection="column" alignItems="flex-end" pt={[2, 0]} pb={3}>
          {getFilterResultCount(filter, page)}
        </Box>
      )}

      {page && page.results.length > 0 && <TxList items={page.results} />}

      {isQueue && page?.results.length === 0 && recoveryQueue.length === 0 && !hasPending && <NoQueuedTxns />}

      {error && <ErrorMessage>Error loading transactions</ErrorMessage>}

      {/* No skeletons for pending as they are shown above the queue which has them */}
      {loading && !hasPending && <SkeletonTxList />}

      {page?.next && onNextPage && (
        <Box my={4} textAlign="center">
          <InfiniteScroll onLoadMore={() => onNextPage(page.next!)} />
        </Box>
      )}
    </>
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

  // Reset the pages when the Safe Account or filter changes
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
    <Box position="relative">
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
    </Box>
  )
}

export default PaginatedTxns
