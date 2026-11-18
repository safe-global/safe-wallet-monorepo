import type { ReactElement, ReactNode } from 'react'
import FilterChips, {
  type FilterChipsProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/FilterChips'
import FilterMenu, {
  type FilterMenuProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/FilterMenu'
import QueueGroupByMenu, {
  type QueueGroupByMenuProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueGroupByMenu'

export type QueueToolbarProps = FilterMenuProps & {
  chips: FilterChipsProps
  groupBy: QueueGroupByMenuProps
  /** Rendered before the Group by menu */
  search?: ReactNode
  /** Rendered after the filters */
  action?: ReactNode
}

const QueueToolbar = ({
  status,
  safe,
  network,
  signer,
  chips,
  groupBy,
  search,
  action,
}: QueueToolbarProps): ReactElement => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-2">
      {search}
      <QueueGroupByMenu {...groupBy} />
      <FilterMenu status={status} safe={safe} network={network} signer={signer} />
      {action}
    </div>
    <FilterChips {...chips} />
  </div>
)

export default QueueToolbar
