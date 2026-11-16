import { memo, useCallback, useDeferredValue, useState, type ReactElement } from 'react'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import {
  QueueEmpty,
  QueueLoadError,
  QueueNoMatches,
  QueueTruncatedNotice,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueStates'
import { POLLING_INTERVAL } from '@/config/constants'
import {
  hasSpaceQueueFilters,
  NO_SPACE_QUEUE_FILTERS,
  useSpaceQueue,
  type SpaceQueue,
  type SpaceQueueFilters,
} from '../../hooks/useSpaceQueue'
import SpaceQueueTable from './SpaceQueueTable'
import TransactionsToolbar from './TransactionsToolbar'
import UnavailableSafesAlert from './UnavailableSafesAlert'

const QueueBody = memo(function QueueBody({
  spaceId,
  queue,
  isFiltered,
  isSearching,
  isFetching,
  onRetry,
  onClearFilters,
}: {
  spaceId: string
  queue: SpaceQueue
  isFiltered: boolean
  isSearching: boolean
  isFetching: boolean
  onRetry: () => void
  onClearFilters: () => void
}): ReactElement {
  const { sections, unavailableSafes } = queue

  return (
    <>
      {unavailableSafes.length > 0 && (
        <UnavailableSafesAlert spaceId={spaceId} safes={unavailableSafes} onRetry={onRetry} isRetrying={isFetching} />
      )}

      {!queue.isComplete && <QueueTruncatedNotice shown={queue.shownCount} total={queue.totalCount} />}

      {sections.length > 0 ? (
        <SpaceQueueTable sections={sections} />
      ) : isFiltered || isSearching ? (
        <QueueNoMatches hasFilters={isFiltered} isSearching={isSearching} onClear={onClearFilters} />
      ) : (
        <QueueEmpty />
      )}
    </>
  )
})

const SpaceTransactionQueue = ({ spaceId }: { spaceId: string }): ReactElement => {
  const [filters, setFilters] = useState<SpaceQueueFilters>(NO_SPACE_QUEUE_FILTERS)
  const [search, setSearch] = useState('')
  // Remounts the toolbar so the search box, which holds its own text, empties too
  const [toolbarKey, setToolbarKey] = useState(0)
  // The toolbar shows a click at once; the table follows in a render that doesn't block it
  const queryFilters = useDeferredValue(filters)
  const querySearch = useDeferredValue(search)
  // Unfiltered, this is the same cache entry useSpaceQueuePolling polls; a filtered view polls its own
  const { queue, counts, isError, isFetching, refetch } = useSpaceQueue(
    spaceId,
    { filters: queryFilters, search: querySearch },
    { pollingInterval: POLLING_INTERVAL, skipPollingIfUnfocused: true },
  )

  const clearFilters = useCallback(() => {
    setFilters(NO_SPACE_QUEUE_FILTERS)
    setSearch('')
    setToolbarKey((key) => key + 1)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <TransactionsToolbar
        key={toolbarKey}
        spaceId={spaceId}
        counts={counts}
        filters={filters}
        onFiltersChange={setFilters}
        onSearchChange={setSearch}
      />

      {queue ? (
        <QueueBody
          spaceId={spaceId}
          queue={queue}
          isFetching={isFetching}
          isFiltered={hasSpaceQueueFilters(queryFilters)}
          isSearching={querySearch !== ''}
          onRetry={refetch}
          onClearFilters={clearFilters}
        />
      ) : isError ? (
        <QueueLoadError onRetry={refetch} />
      ) : (
        <SkeletonTxList />
      )}
    </div>
  )
}

export default SpaceTransactionQueue
