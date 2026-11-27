import { memo, useCallback, useDeferredValue, useState, type ReactElement } from 'react'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import {
  QueueEmpty,
  QueueLoadError,
  QueueNoMatches,
  QueueRefreshFailed,
  QueueTruncatedNotice,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueStates'
import QueueUpdatingStatus from '@safe-global/views/features/spaces/components/SpaceQueue/QueueUpdatingStatus'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { cn } from '@safe-global/views/utils/cn'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  hasSpaceQueueFilters,
  NO_SPACE_QUEUE_FILTERS,
  useSpaceQueue,
  type SpaceQueue,
  type SpaceQueueFilters,
} from '../../hooks/useSpaceQueue'
import { selectQueueGroupBy, setQueueGroupBy } from '../../public/store/spaceQueueViewSlice'
import SpaceQueueTable from './SpaceQueueTable'
import TransactionsToolbar from './TransactionsToolbar/TransactionsToolbar'

const QueueBody = memo(function QueueBody({
  queue,
  groupBy,
  isFiltered,
  isSearching,
  onClearFilters,
}: {
  queue: SpaceQueue
  groupBy: QueueGroupBy
  isFiltered: boolean
  isSearching: boolean
  onClearFilters: () => void
}): ReactElement {
  const { sections } = queue

  return (
    <>
      {!queue.isComplete && <QueueTruncatedNotice shown={queue.shownCount} total={queue.totalCount} />}

      {sections.length > 0 ? (
        <SpaceQueueTable sections={sections} groupBy={groupBy} />
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
  const dispatch = useAppDispatch()
  const groupBy = useAppSelector(selectQueueGroupBy)
  const tableGroupBy = useDeferredValue(groupBy)
  const changeGroupBy = useCallback((next: QueueGroupBy) => dispatch(setQueueGroupBy(next)), [dispatch])
  // The toolbar shows a click at once; the table follows in a render that doesn't block it
  const queryFilters = useDeferredValue(filters)
  const querySearch = useDeferredValue(search)
  // Unfiltered, this is the same cache entry useSpaceQueuePolling polls; a filtered view polls its own
  const { queue, queueQuery, isStale, counts, isError, isRetryingError, isRefreshFailing, refetch } = useSpaceQueue(
    spaceId,
    { filters: queryFilters, search: querySearch },
    { poll: true },
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
        groupBy={groupBy}
        onGroupByChange={changeGroupBy}
      />

      {queue && isRefreshFailing && <QueueRefreshFailed />}

      {queue ? (
        // Old rows stay to avoid a flicker, but inert: they may no longer match the new search or filter
        <div className={cn('relative', isStale && 'cursor-progress')}>
          <QueueUpdatingStatus isStale={isStale} />
          <div
            data-testid="space-queue-body"
            aria-busy={isStale}
            inert={isStale}
            className={cn('flex flex-col gap-6 transition-opacity', isStale && 'opacity-50')}
          >
            <QueueBody
              queue={queue}
              groupBy={tableGroupBy}
              isFiltered={hasSpaceQueueFilters(queueQuery.filters)}
              isSearching={!!queueQuery.search}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      ) : isError ? (
        <QueueLoadError onRetry={refetch} isRetrying={isRetryingError} />
      ) : (
        <SkeletonTxList />
      )}
    </div>
  )
}

export default SpaceTransactionQueue
