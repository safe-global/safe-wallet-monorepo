import type { ReactElement } from 'react'
import { CalendarClock, CircleCheck, Clock3, PenLine, Split, Users, type LucideIcon } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { DropdownMenuSeparator } from '@safe-global/views/components/ui/dropdown-menu'
import type { QueueStatusOption } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import FilterOptionItem from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/FilterOptionItem'
import { STATUS_OPTION_LABELS } from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/labels'

const SUCCESS_TILE = 'bg-success-subtle text-success-strong'
const WARNING_TILE = 'bg-warning-subtle text-warning-strong'

// Flags only narrow the statuses, so they get a plain icon instead of a tinted tile
const STATUS_OPTION_ICONS: Record<QueueStatusOption, { icon: LucideIcon; tile?: string }> = {
  execute: { icon: CircleCheck, tile: SUCCESS_TILE },
  sign: { icon: PenLine, tile: SUCCESS_TILE },
  blocked: { icon: Clock3, tile: WARNING_TILE },
  waiting: { icon: Users, tile: WARNING_TILE },
  conflicting: { icon: Split },
  stale: { icon: CalendarClock },
}

const StatusOptionIcon = ({ option }: { option: QueueStatusOption }): ReactElement => {
  const { icon: Icon, tile } = STATUS_OPTION_ICONS[option]
  return (
    <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
      {tile ? (
        <span className={`flex size-4 items-center justify-center rounded ${tile}`}>
          <Icon className="size-3" strokeWidth={ICON_STROKE} />
        </span>
      ) : (
        <Icon className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
      )}
    </span>
  )
}

export type StatusOptionsProps = {
  statuses: readonly QueueStatusOption[]
  /** Listed after the statuses, apart */
  flags: readonly QueueStatusOption[]
  /** An option without a count shows none */
  counts: Partial<Record<QueueStatusOption, number>>
  selected: QueueStatusOption[]
  onToggle: (option: QueueStatusOption) => void
}

/** The Status filter's checkboxes in the Filter menu */
const StatusOptions = ({ statuses, flags, counts, selected, onToggle }: StatusOptionsProps): ReactElement => {
  const renderOption = (option: QueueStatusOption) => (
    <FilterOptionItem
      key={option}
      icon={<StatusOptionIcon option={option} />}
      label={STATUS_OPTION_LABELS[option].menu}
      count={counts[option]}
      checked={selected.includes(option)}
      onToggle={() => onToggle(option)}
    />
  )

  return (
    <>
      {statuses.map(renderOption)}
      <DropdownMenuSeparator />
      {flags.map(renderOption)}
    </>
  )
}

export default StatusOptions
