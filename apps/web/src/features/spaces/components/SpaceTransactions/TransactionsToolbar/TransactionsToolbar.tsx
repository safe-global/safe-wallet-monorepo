import type { ReactElement } from 'react'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import QueueToolbar from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/QueueToolbar'
import type { SpaceQueueFilters } from '../../../store/spaceQueueApi'
import NewTransactionButton from '../NewTransactionButton'
import SearchTransactions from './SearchTransactions'
import { useQueueFilterOptions } from './useQueueFilterOptions'

type TransactionsToolbarProps = {
  spaceId: string
  counts?: SpaceQueueCounts
  filters: SpaceQueueFilters
  onFiltersChange: (filters: SpaceQueueFilters) => void
  onSearchChange: (search: string) => void
}

const TransactionsToolbar = ({
  spaceId,
  counts,
  filters,
  onFiltersChange,
  onSearchChange,
}: TransactionsToolbarProps): ReactElement => {
  const options = useQueueFilterOptions(counts, filters, onFiltersChange)
  return (
    <QueueToolbar
      {...options}
      search={<SearchTransactions onSearch={onSearchChange} />}
      action={<NewTransactionButton spaceId={spaceId} />}
    />
  )
}

export default TransactionsToolbar
