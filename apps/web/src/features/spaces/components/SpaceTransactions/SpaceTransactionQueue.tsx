import type { ReactElement } from 'react'
import PagePlaceholder from '@safe-global/views/components/common/PagePlaceholder'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import ErrorMessage from '@/components/tx/ErrorMessage'
import NoTransactionsIcon from '@/public/images/transactions/no-transactions.svg'
import { useGetSpaceQueueQuery } from '../../store/spaceQueueApi'
import SpaceQueueTable from './SpaceQueueTable'

const LoadError = ({ onRetry }: { onRetry: () => void }): ReactElement => (
  <div className="flex flex-col items-start gap-3">
    <ErrorMessage>Error loading transactions</ErrorMessage>
    <Button size="sm" variant="outline" onClick={onRetry}>
      Try again
    </Button>
  </div>
)

const SpaceTransactionQueue = ({ spaceId }: { spaceId: string }): ReactElement => {
  const { currentData, isError, refetch } = useGetSpaceQueueQuery({ spaceId })

  if (!currentData) return isError ? <LoadError onRetry={refetch} /> : <SkeletonTxList />

  const { sections, unavailableSafes } = currentData
  // The gateway answers a failed queue read with every Safe unavailable rather than an error
  if (sections.length === 0 && unavailableSafes.length > 0) return <LoadError onRetry={refetch} />

  return (
    <div className="flex flex-col gap-6">
      {unavailableSafes.length > 0 && (
        <Typography variant="paragraph-small" color="muted">
          {unavailableSafes.length === 1
            ? "1 Safe account couldn't be loaded, so its transactions aren't shown."
            : `${unavailableSafes.length} Safe accounts couldn't be loaded, so their transactions aren't shown.`}
        </Typography>
      )}

      {!currentData.isComplete && (
        <Typography variant="paragraph-small" color="muted">
          Showing {currentData.shownCount} of {currentData.totalCount} pending transactions.
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
    </div>
  )
}

export default SpaceTransactionQueue
