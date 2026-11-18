import type { ReactElement } from 'react'
import { Info } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@safe-global/views/components/common/Identicon'
import { DropdownMenuSeparator } from '@safe-global/views/components/ui/dropdown-menu'
import FilterOptionItem, {
  NoFilterOptions,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/FilterOptionItem'

export type SafeOptionRow = {
  safeAddress: string
  /** The address is shown when empty */
  name: string
  count: number
  checked: boolean
}

export type SafeOptionsProps = {
  options: SafeOptionRow[]
  onToggle: (safeAddress: string) => void
}

/** The Safe filter's checkboxes in the Filter menu */
const SafeOptions = ({ options, onToggle }: SafeOptionsProps): ReactElement => {
  if (options.length === 0) return <NoFilterOptions>No Safe accounts</NoFilterOptions>

  return (
    <>
      {options.map(({ safeAddress, name, count, checked }) => (
        <FilterOptionItem
          key={safeAddress}
          icon={<Identicon address={safeAddress} size={16} />}
          label={name || shortenAddress(safeAddress)}
          count={count}
          checked={checked}
          onToggle={() => onToggle(safeAddress)}
        />
      ))}
      <DropdownMenuSeparator />
      <p className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5" />
        Sorted by number of transactions
      </p>
    </>
  )
}

export default SafeOptions
