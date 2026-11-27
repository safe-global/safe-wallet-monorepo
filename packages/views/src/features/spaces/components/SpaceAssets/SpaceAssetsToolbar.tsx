import type { ReactElement, ReactNode } from 'react'
import { ListFilter } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import FilterChips from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/FilterChips'
import NetworkOptions, {
  type NetworkOptionsProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/NetworkOptions'
import SafeOptions, {
  type SafeOptionsProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/SafeOptions'

export type SpaceAssetsToolbarProps = {
  safe: SafeOptionsProps
  network: NetworkOptionsProps
  chips: {
    safes: { safeAddress: string; name: string }[]
    networkNames: string[]
  }
  onRemove: (filter: 'safes' | 'chainIds') => void
  onClear: () => void
  /** Rendered first, as in the queue's toolbar */
  search?: ReactNode
}

/** The queue's toolbar for the assets: search and the Safe account and Network filters, then the chips */
const SpaceAssetsToolbar = ({
  safe,
  network,
  chips,
  onRemove,
  onClear,
  search,
}: SpaceAssetsToolbarProps): ReactElement => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-2">
      {search}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          <ListFilter />
          Filter
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Safe account</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-64">
              <SafeOptions {...safe} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Network</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-56">
              <NetworkOptions {...network} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <FilterChips
      safes={chips.safes}
      networkNames={chips.networkNames}
      statuses={[]}
      signerNames={[]}
      onRemove={(filter) => {
        if (filter === 'safes' || filter === 'chainIds') onRemove(filter)
      }}
      onClear={onClear}
    />
  </div>
)

export default SpaceAssetsToolbar
