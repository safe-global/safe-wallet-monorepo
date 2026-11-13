import type { ReactElement } from 'react'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { QueueGroupByMenu, type QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue'
import type { SpaceQueueFilters } from '../../../store/spaceQueueApi'
import NewTransactionButton from '../NewTransactionButton'
import FilterChips from './FilterChips'
import FilterMenu from './FilterMenu'
import SearchTransactions from './SearchTransactions'

type TransactionsToolbarProps = {
  spaceId: string
  counts?: SpaceQueueCounts
  filters: SpaceQueueFilters
  onFiltersChange: (filters: SpaceQueueFilters) => void
  onSearchChange: (search: string) => void
  groupBy: QueueGroupBy
  onGroupByChange: (groupBy: QueueGroupBy) => void
}

const TransactionsToolbar = ({
  spaceId,
  counts,
  filters,
  onFiltersChange,
  onSearchChange,
  groupBy,
  onGroupByChange,
}: TransactionsToolbarProps): ReactElement => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchTransactions onSearch={onSearchChange} />
        <QueueGroupByMenu value={groupBy} onChange={onGroupByChange} />
        <FilterMenu counts={counts} filters={filters} onChange={onFiltersChange} />
        <NewTransactionButton spaceId={spaceId} />
      </div>
      <FilterChips
        filters={filters}
        chainIds={(counts?.chains ?? []).map(({ chainId }) => chainId)}
        onChange={onFiltersChange}
      />
    </div>
  )
}

export default TransactionsToolbar
