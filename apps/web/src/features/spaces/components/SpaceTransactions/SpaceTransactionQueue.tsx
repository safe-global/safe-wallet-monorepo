import type { ReactElement } from 'react'
import PagePlaceholder from '@safe-global/views/components/common/PagePlaceholder'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import { Typography } from '@safe-global/views/components/ui/typography'
import NoTransactionsIcon from '@/public/images/transactions/no-transactions.svg'
import { useGetSpaceQueueQuery, type SpaceQueue } from '../../store/spaceQueueApi'
import { QueueLoadError } from './QueueStates'
import SpaceQueueTable from './SpaceQueueTable'
import TransactionsToolbar from './TransactionsToolbar'

const QueueBody = ({ queue }: { queue: SpaceQueue }): ReactElement => {
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
      ) : (
        <PagePlaceholder
          img={<NoTransactionsIcon />}
          text="Pending transactions of your Safe accounts will appear here"
        />
      )}
    </>
  )
}

const SpaceTransactionQueue = ({ spaceId }: { spaceId: string }): ReactElement => {
  const { currentData, isError, refetch } = useGetSpaceQueueQuery({ spaceId })

  return (
    <div className="flex flex-col gap-6">
      <TransactionsToolbar spaceId={spaceId} />

      {currentData ? (
        <QueueBody queue={currentData} />
      ) : isError ? (
        <QueueLoadError onRetry={refetch} />
      ) : (
        <SkeletonTxList />
      )}
    </div>
  )
}

export default SpaceTransactionQueue
