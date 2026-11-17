import type { ReactElement } from 'react'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import {
  QueueEmpty,
  QueueLoadError,
  QueueTruncatedNotice,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueStates'
import { useSpaceQueue, type SpaceQueue } from '../../store/spaceQueueApi'
import SpaceQueueTable from './SpaceQueueTable'
import TransactionsToolbar from './TransactionsToolbar'

const QueueBody = ({ queue }: { queue: SpaceQueue }): ReactElement => (
  <>
    {!queue.isComplete && <QueueTruncatedNotice shown={queue.shownCount} total={queue.totalCount} />}
    {queue.sections.length > 0 ? <SpaceQueueTable sections={queue.sections} /> : <QueueEmpty />}
  </>
)

const SpaceTransactionQueue = ({ spaceId }: { spaceId: string }): ReactElement => {
  const { queue, isError, refetch } = useSpaceQueue(spaceId)

  return (
    <div className="flex flex-col gap-6">
      <TransactionsToolbar spaceId={spaceId} />

      {queue ? <QueueBody queue={queue} /> : isError ? <QueueLoadError onRetry={refetch} /> : <SkeletonTxList />}
    </div>
  )
}

export default SpaceTransactionQueue
