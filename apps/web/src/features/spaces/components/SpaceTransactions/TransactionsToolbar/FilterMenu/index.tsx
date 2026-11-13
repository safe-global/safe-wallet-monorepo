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
import NetworkOptions from '../NetworkOptions'
import SafeOptions from '../SafeOptions'
import SignerOptions from '../SignerOptions'
import StatusOptions from '../StatusOptions'

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
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Network</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-56">
          <NetworkOptions
            counts={counts}
            selected={filters.chainIds}
            onChange={(chainIds) => onChange({ ...filters, chainIds })}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Signer</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-64">
          <SignerOptions
            counts={counts}
            selected={filters.signers}
            onChange={(signers) => onChange({ ...filters, signers })}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
)

export default FilterMenu
