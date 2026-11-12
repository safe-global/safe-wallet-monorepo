import type { TransactionItemPage, QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement, useEffect, useState, useCallback, useRef } from 'react'
import TxList from '@/components/transactions/TxList'
import ErrorMessage from '@/components/tx/ErrorMessage'
import type useTxHistory from '@/hooks/useTxHistory'
import useTxQueue from '@/hooks/useTxQueue'
import PagePlaceholder from '@safe-global/views/components/common/PagePlaceholder'
import InfiniteScroll from '../InfiniteScroll'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import ShowTransfersHint from '@safe-global/views/components/common/PaginatedTxns/ShowTransfersHint'
import Track from '@/components/common/Track'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import { type TxFilter, TxFilterType, isTransfersOnlyFilter, useTxFilter } from '@/utils/tx-history-filter'
import { isTransactionListItem } from '@/utils/transaction-guards'
import NoTransactionsIcon from '@/public/images/transactions/no-transactions.svg'
import { useHasPendingTxs } from '@/hooks/usePendingTxs'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useRecoveryQueue } from '@/features/recovery'
import { isSamePage } from '@/utils/tx-list'

const NoQueuedTxns = () => {
  return <PagePlaceholder img={<NoTransactionsIcon />} text="Queued transactions will appear here" />
}

const getFilterResultCount = (filter: TxFilter, page: TransactionItemPage | QueuedItemPage) => {
  const count = page.results.filter(isTransactionListItem).length

  return `${page.next ? '> ' : ''}${count} ${filter.type} transactions found`.toLowerCase()
}

const getTransfersResultCount = (pages: Array<QueuedItemPage | undefined>): string | undefined => {
  const loadedPages = pages.filter((page) => !!page)
  const count = loadedPages.reduce((sum, page) => sum + page.results.filter(isTransactionListItem).length, 0)
  const hasMore = loadedPages.length < pages.length || !!loadedPages.at(-1)?.next

  if (count === 0 && hasMore) return undefined

  return `${hasMore ? '> ' : ''}${count} outgoing ${count === 1 ? 'transfer' : 'transfers'} found`
}

const isEmptyRecipientSearch = (filter: TxFilter, page: TransactionItemPage | QueuedItemPage): boolean => {
  return (
    filter.type === TxFilterType.MULTISIG &&
    !isTransfersOnlyFilter(filter) &&
    'to' in filter.filter &&
    !!filter.filter.to &&
    !page.next &&
    page.results.filter(isTransactionListItem).length === 0
  )
}

// The transfers route can't filter by amount or nonce
const toTransfersFilter = ({ type, filter }: TxFilter): TxFilter => {
  const { value: _value, nonce: _nonce, ...rest } = filter as { value?: string; nonce?: string }
  return { type, filter: { ...rest, transfers: 'true' } }
}

// Transfer pages have no `count`, so two pages of different filters can share `count` and `next`
const isSameLoadedPage = (pageA: QueuedItemPage, pageB: QueuedItemPage, isTransfersOnly: boolean): boolean => {
  return isSamePage(pageA, pageB) && (!isTransfersOnly || pageA.results.length === pageB.results.length)
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
  const [filter, setFilter] = useTxFilter()
  const isTransfersOnly = !!filter && isTransfersOnlyFilter(filter)
  const isQueue = useTxns === useTxQueue
  const recoveryQueue = useRecoveryQueue()
  const hasPending = useHasPendingTxs()

  const lastPageRef = useRef<QueuedItemPage>(undefined)

  useEffect(() => {
    const loadedPage = page as QueuedItemPage | undefined
    if (loadedPage && (!lastPageRef.current || !isSameLoadedPage(loadedPage, lastPageRef.current, isTransfersOnly))) {
      lastPageRef.current = loadedPage
      onPageLoaded(loadedPage)
    }
  }, [page, onPageLoaded, isTransfersOnly])

  return (
    <>
      {isFirstPage && filter && !isTransfersOnly && page && (
        <div className="flex flex-col items-end pt-4 pb-6 sm:pt-0">{getFilterResultCount(filter, page)}</div>
      )}

      {page && page.results.length > 0 && <TxList items={page.results} />}

      {isFirstPage && filter && page && isEmptyRecipientSearch(filter, page) && (
        <Track {...TX_LIST_EVENTS.FILTER} label="transfers_hint" as="div">
          <ShowTransfersHint onShowTransfers={() => setFilter(toTransfersFilter(filter))} />
        </Track>
      )}

      {isQueue && page?.results.length === 0 && recoveryQueue.length === 0 && !hasPending && <NoQueuedTxns />}

      {error && <ErrorMessage>Error loading transactions</ErrorMessage>}

      {/* No skeletons for pending as they are shown above the queue which has them */}
      {loading && !hasPending && (!page || page.results.length === 0) && <SkeletonTxList />}

      {page?.next && onNextPage && (
        <div className="my-8 text-center">
          <InfiniteScroll onLoadMore={() => onNextPage(page.next!)} />
        </div>
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
  const isTransfersOnly = !!filter && isTransfersOnlyFilter(filter)
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
        if (currentPage && isSameLoadedPage(currentPage, page, isTransfersOnly)) {
          return prev
        }
        const updated = new Map(prev)
        updated.set(pageUrl, page)
        return updated
      })
    },
    [isTransfersOnly],
  )

  const transfersResultCount = isTransfersOnly
    ? getTransfersResultCount(pages.map((url) => loadedPages.get(url)))
    : undefined

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
    <div className="relative">
      {transfersResultCount && <div className="flex flex-col items-end pt-4 pb-6 sm:pt-0">{transfersResultCount}</div>}

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
    </div>
  )
}

export default PaginatedTxns
