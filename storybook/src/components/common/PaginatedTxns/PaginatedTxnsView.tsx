import type { ReactElement, ReactNode } from 'react'
import PagePlaceholder from '@views/components/common/PagePlaceholder'
import SkeletonTxList from '@views/components/common/PaginatedTxns/SkeletonTxList'
import NoTransactionsIcon from '@/public/images/transactions/no-transactions.svg'

const NoQueuedTxns = () => {
  return <PagePlaceholder img={<NoTransactionsIcon />} text="Queued transactions will appear here" />
}

export type TxPageViewProps = {
  /** Set on the first page when a filter is active */
  filterResult?: { type: string; count: number; hasMore: boolean }
  txList?: ReactNode
  showNoQueued: boolean
  hasError: boolean
  /** Renders the ErrorMessage container with the given message */
  renderErrorMessage: (message: ReactNode) => ReactNode
  showSkeleton: boolean
  loadMore?: ReactNode
}

export function TxPageView({
  filterResult,
  txList,
  showNoQueued,
  hasError,
  renderErrorMessage,
  showSkeleton,
  loadMore,
}: TxPageViewProps): ReactElement {
  return (
    <>
      {filterResult && (
        <div className="flex flex-col items-end pt-4 pb-6 sm:pt-0">
          {`${filterResult.hasMore ? '> ' : ''}${filterResult.count} ${filterResult.type} transactions found`.toLowerCase()}
        </div>
      )}

      {txList}

      {showNoQueued && <NoQueuedTxns />}

      {hasError && renderErrorMessage('Error loading transactions')}

      {/* No skeletons for pending as they are shown above the queue which has them */}
      {showSkeleton && <SkeletonTxList />}

      {loadMore && <div className="my-8 text-center">{loadMore}</div>}
    </>
  )
}

export function PaginatedTxnsView({ children }: { children: ReactNode }): ReactElement {
  return <div className="relative">{children}</div>
}
