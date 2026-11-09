import type { ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { SPACE_QUEUE_FLAGS, SPACE_QUEUE_STATUSES, type SpaceQueueStatusOption } from '../../../../store/spaceQueueApi'
import { STATUS_OPTION_LABELS } from '../utils'

type StatusOptionsProps = {
  counts?: SpaceQueueCounts
  selected: SpaceQueueStatusOption[]
  onChange: (selected: SpaceQueueStatusOption[]) => void
}

/** The Status filter's checkboxes, shared by its own menu and the Filter menu. */
export const StatusOptions = ({ counts, selected, onChange }: StatusOptionsProps): ReactElement => {
  const toggle = (option: SpaceQueueStatusOption, checked: boolean) =>
    onChange(checked ? [...selected, option] : selected.filter((other) => other !== option))

  const renderOption = (option: SpaceQueueStatusOption) => (
    <DropdownMenuCheckboxItem
      key={option}
      checked={selected.includes(option)}
      onCheckedChange={(checked) => toggle(option, checked)}
    >
      {STATUS_OPTION_LABELS[option].menu}
      <span className="ml-auto pl-6 tabular-nums text-muted-foreground">{counts?.[option] ?? 0}</span>
    </DropdownMenuCheckboxItem>
  )

  return (
    <>
      {SPACE_QUEUE_STATUSES.map(renderOption)}
      <DropdownMenuSeparator />
      {SPACE_QUEUE_FLAGS.map(renderOption)}
    </>
  )
}

const StatusFilter = (props: StatusOptionsProps): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" />}>
      Status
      <ChevronDown />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-56">
      <StatusOptions {...props} />
    </DropdownMenuContent>
  </DropdownMenu>
)

export default StatusFilter
