import type { ReactElement } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import type { SpaceQueueCounts, SpaceQueueSafe } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import Identicon from '@safe-global/views/components/common/Identicon'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { getSafeOptions, isSafeOptionSelected, toggleSafeOption, type SafeOption } from '../utils'

type SafeOptionsProps = {
  counts?: SpaceQueueCounts
  selected: SpaceQueueSafe[]
  onChange: (selected: SpaceQueueSafe[]) => void
}

const SafeOptionItem = ({
  option,
  checked,
  onToggle,
}: {
  option: SafeOption
  checked: boolean
  onToggle: () => void
}): ReactElement => {
  const name = useSafeDisplayName(option.safeAddress, option.chainIds[0] ?? '')
  return (
    <DropdownMenuCheckboxItem checked={checked} onCheckedChange={onToggle}>
      <Identicon address={option.safeAddress} size={16} />
      <span className="truncate">{name || shortenAddress(option.safeAddress)}</span>
      <span className="ml-auto pl-6 tabular-nums text-muted-foreground">{option.count}</span>
    </DropdownMenuCheckboxItem>
  )
}

/** The Safe filter's checkboxes, shared by its own menu and the Filter menu. */
export const SafeOptions = ({ counts, selected, onChange }: SafeOptionsProps): ReactElement => {
  const options = getSafeOptions(counts?.safes ?? [])

  if (options.length === 0) {
    return <p className="px-2 py-1.5 text-sm text-muted-foreground">No Safe accounts</p>
  }

  return (
    <>
      {options.map((option) => (
        <SafeOptionItem
          key={option.safeAddress}
          option={option}
          checked={isSafeOptionSelected(option, selected)}
          onToggle={() => onChange(toggleSafeOption(option, selected))}
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

const SafeFilter = (props: SafeOptionsProps): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" />}>
      Safe
      <ChevronDown />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-64">
      <SafeOptions {...props} />
    </DropdownMenuContent>
  </DropdownMenu>
)

export default SafeFilter
