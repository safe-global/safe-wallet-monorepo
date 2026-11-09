import type { ReactElement } from 'react'
import { ListFilter } from 'lucide-react'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import type { SpaceQueueFilters } from '../../../../store/spaceQueueApi'
import { SafeOptions } from '../SafeFilter'
import { StatusOptions } from '../StatusFilter'

type FilterMenuProps = {
  counts?: SpaceQueueCounts
  filters: SpaceQueueFilters
  onChange: (filters: SpaceQueueFilters) => void
}

const FilterMenu = ({ counts, filters, onChange }: FilterMenuProps): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" />}>
      <ListFilter />
      Filter
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-44">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-56">
          <StatusOptions
            counts={counts}
            selected={filters.statuses}
            onChange={(statuses) => onChange({ ...filters, statuses })}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Safe account</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-64">
          <SafeOptions counts={counts} selected={filters.safes} onChange={(safes) => onChange({ ...filters, safes })} />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
)

export default FilterMenu
