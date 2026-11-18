import type { ReactElement } from 'react'
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
import NetworkOptions, {
  type NetworkOptionsProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/NetworkOptions'
import {
  SafeOptions,
  type SafeOptionsProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/SafeFilter'
import SignerOptions, {
  type SignerOptionsProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/SignerOptions'
import {
  StatusOptions,
  type StatusOptionsProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/StatusFilter'

export type FilterMenuProps = {
  status: StatusOptionsProps
  safe: SafeOptionsProps
  network: NetworkOptionsProps
  signer: SignerOptionsProps
}

const FilterMenu = ({ status, safe, network, signer }: FilterMenuProps): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" />}>
      <ListFilter />
      Filter
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-44">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-56">
          <StatusOptions {...status} />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
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
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Signer</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-64">
          <SignerOptions {...signer} />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
)

export default FilterMenu
