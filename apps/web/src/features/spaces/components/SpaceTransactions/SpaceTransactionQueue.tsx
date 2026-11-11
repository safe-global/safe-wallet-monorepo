import { memo, useCallback, useDeferredValue, useState, type ReactElement } from 'react'
import PagePlaceholder from '@safe-global/views/components/common/PagePlaceholder'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import { Typography } from '@safe-global/views/components/ui/typography'
import NoTransactionsIcon from '@/public/images/transactions/no-transactions.svg'
import {
  hasSpaceQueueFilters,
  NO_SPACE_QUEUE_FILTERS,
  useGetSpaceQueueQuery,
  type SpaceQueue,
  type SpaceQueueFilters,
} from '../../store/spaceQueueApi'
import { QueueLoadError, QueueNoMatches } from './QueueStates'
import SpaceQueueTable from './SpaceQueueTable'
import TransactionsToolbar from './TransactionsToolbar'

const QueueBody = memo(function QueueBody({
  queue,
  isFiltered,
  onClearFilters,
}: {
  queue: SpaceQueue
  isFiltered: boolean
  onClearFilters: () => void
}): ReactElement {
  const { sections } = queue

  return (
    <>
      {!queue.isComplete && (
        <Typography variant="paragraph-small" color="muted">
          Showing {queue.shownCount} of {queue.totalCount} pending transactions.
        </Typography>
      )}

      {sections.length > 0 ? (
        <SpaceQueueTable sections={sections} />
      ) : isFiltered ? (
        <QueueNoMatches onClear={onClearFilters} />
      ) : (
        <PagePlaceholder
          img={<NoTransactionsIcon />}
          text="Pending transactions of your Safe accounts will appear here"
        />
      )}
    </>
  )
})

const SpaceTransactionQueue = ({ spaceId }: { spaceId: string }): ReactElement => {
  const [filters, setFilters] = useState<SpaceQueueFilters>(NO_SPACE_QUEUE_FILTERS)
  // The toolbar shows a click at once; the table follows in a render that doesn't block it
  const queryFilters = useDeferredValue(filters)
  // `data` keeps the last answer while a new filter loads, so the menus keep their counts
  const { data, currentData, isError, refetch } = useGetSpaceQueueQuery({
    spaceId,
    filters: queryFilters,
  })

  const clearFilters = useCallback(() => {
    setFilters(NO_SPACE_QUEUE_FILTERS)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <TransactionsToolbar spaceId={spaceId} counts={data?.counts} filters={filters} onFiltersChange={setFilters} />

      {currentData ? (
        <QueueBody queue={currentData} isFiltered={hasSpaceQueueFilters(queryFilters)} onClearFilters={clearFilters} />
      ) : isError ? (
        <QueueLoadError onRetry={refetch} />
      ) : (
        <SkeletonTxList />
      )}
    </div>
  )
}

export default SpaceTransactionQueue
