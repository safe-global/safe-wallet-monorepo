import { memo, useCallback, useDeferredValue, useState, type ReactElement } from 'react'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import {
  QueueEmpty,
  QueueLoadError,
  QueueNoMatches,
  QueueTruncatedNotice,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueStates'
import {
  hasSpaceQueueFilters,
  NO_SPACE_QUEUE_FILTERS,
  useSpaceQueue,
  type SpaceQueue,
  type SpaceQueueFilters,
} from '../../store/spaceQueueApi'
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
      {!queue.isComplete && <QueueTruncatedNotice shown={queue.shownCount} total={queue.totalCount} />}

      {sections.length > 0 ? (
        <SpaceQueueTable sections={sections} />
      ) : isFiltered ? (
        <QueueNoMatches onClear={onClearFilters} />
      ) : (
        <QueueEmpty />
      )}
    </>
  )
})

const SpaceTransactionQueue = ({ spaceId }: { spaceId: string }): ReactElement => {
  const [filters, setFilters] = useState<SpaceQueueFilters>(NO_SPACE_QUEUE_FILTERS)
  // The toolbar shows a click at once; the table follows in a render that doesn't block it
  const queryFilters = useDeferredValue(filters)
  const { queue, counts, isError, refetch } = useSpaceQueue(spaceId, queryFilters)

  const clearFilters = useCallback(() => {
    setFilters(NO_SPACE_QUEUE_FILTERS)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <TransactionsToolbar spaceId={spaceId} counts={counts} filters={filters} onFiltersChange={setFilters} />

      {queue ? (
        <QueueBody queue={queue} isFiltered={hasSpaceQueueFilters(queryFilters)} onClearFilters={clearFilters} />
      ) : isError ? (
        <QueueLoadError onRetry={refetch} />
      ) : (
        <SkeletonTxList />
      )}
    </div>
  )
}

export default SpaceTransactionQueue
