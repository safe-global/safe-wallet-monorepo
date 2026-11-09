import { memo, useDeferredValue, useState, type ReactElement } from 'react'
import PagePlaceholder from '@safe-global/views/components/common/PagePlaceholder'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import ErrorMessage from '@/components/tx/ErrorMessage'
import NoTransactionsIcon from '@/public/images/transactions/no-transactions.svg'
import {
  hasSpaceQueueFilters,
  NO_SPACE_QUEUE_FILTERS,
  useGetSpaceQueueQuery,
  type SpaceQueue,
  type SpaceQueueFilters,
} from '../../store/spaceQueueApi'
import SpaceQueueTable from './SpaceQueueTable'
import TransactionsToolbar from './TransactionsToolbar'
import UnavailableSafesAlert from './UnavailableSafesAlert'

const LoadError = ({ onRetry }: { onRetry: () => void }): ReactElement => (
  <div className="flex flex-col items-start gap-3">
    <ErrorMessage>Error loading transactions</ErrorMessage>
    <Button size="sm" variant="outline" onClick={onRetry}>
      Try again
    </Button>
  </div>
)

const getEmptyText = (isFiltered: boolean, isSearching: boolean): string => {
  if (isSearching) return 'No pending transactions match your search'
  if (isFiltered) return 'No pending transactions match these filters'
  return 'Pending transactions of your Safe accounts will appear here'
}

const QueueBody = memo(function QueueBody({
  spaceId,
  queue,
  isFiltered,
  isSearching,
  isFetching,
  onRetry,
}: {
  spaceId: string
  queue: SpaceQueue
  isFiltered: boolean
  isSearching: boolean
  isFetching: boolean
  onRetry: () => void
}): ReactElement {
  const { sections, unavailableSafes } = queue
  // The gateway answers a failed queue read with every Safe unavailable rather than an error
  if (sections.length === 0 && unavailableSafes.length > 0) return <LoadError onRetry={onRetry} />

  return (
    <>
      {unavailableSafes.length > 0 && (
        <UnavailableSafesAlert spaceId={spaceId} safes={unavailableSafes} onRetry={onRetry} isRetrying={isFetching} />
      )}

      {!queue.isComplete && (
        <Typography variant="paragraph-small" color="muted">
          Showing {queue.shownCount} of {queue.totalCount} pending transactions.
        </Typography>
      )}

      {sections.length > 0 ? (
        <SpaceQueueTable sections={sections} />
      ) : (
        <PagePlaceholder img={<NoTransactionsIcon />} text={getEmptyText(isFiltered, isSearching)} />
      )}
    </>
  )
})

const SpaceTransactionQueue = ({ spaceId }: { spaceId: string }): ReactElement => {
  const [filters, setFilters] = useState<SpaceQueueFilters>(NO_SPACE_QUEUE_FILTERS)
  const [search, setSearch] = useState('')
  // The toolbar shows a click at once; the table follows in a render that doesn't block it
  const queryFilters = useDeferredValue(filters)
  const querySearch = useDeferredValue(search)
  // `data` keeps the last answer while a new filter loads, so the menus keep their counts
  const { data, currentData, isError, isFetching, refetch } = useGetSpaceQueueQuery({
    spaceId,
    filters: queryFilters,
    ...(querySearch && { search: querySearch }),
  })

  return (
    <div className="flex flex-col gap-6">
      <TransactionsToolbar
        spaceId={spaceId}
        counts={data?.counts}
        filters={filters}
        onFiltersChange={setFilters}
        onSearchChange={setSearch}
      />

      {currentData ? (
        <QueueBody
          spaceId={spaceId}
          queue={currentData}
          isFetching={isFetching}
          isFiltered={hasSpaceQueueFilters(queryFilters)}
          isSearching={querySearch !== ''}
          onRetry={refetch}
        />
      ) : isError ? (
        <LoadError onRetry={refetch} />
      ) : (
        <SkeletonTxList />
      )}
    </div>
  )
}

export default SpaceTransactionQueue
