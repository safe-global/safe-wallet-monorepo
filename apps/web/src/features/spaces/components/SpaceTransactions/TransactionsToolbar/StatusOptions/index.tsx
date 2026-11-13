import type { ReactElement } from 'react'
import { CalendarClock, CircleCheck, Clock3, PenLine, Split, Users, type LucideIcon } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@safe-global/views/components/ui/dropdown-menu'
import { SPACE_QUEUE_FLAGS, SPACE_QUEUE_STATUSES, type SpaceQueueStatusOption } from '../../../../store/spaceQueueApi'
import { STATUS_OPTION_LABELS } from '../utils'

const SUCCESS_TILE = 'bg-success-subtle text-success-strong'
const WARNING_TILE = 'bg-warning-subtle text-warning-strong'

// Flags only narrow the statuses, so they get a plain icon instead of a tinted tile.
const STATUS_OPTION_ICONS: Record<SpaceQueueStatusOption, { icon: LucideIcon; tile?: string }> = {
  execute: { icon: CircleCheck, tile: SUCCESS_TILE },
  sign: { icon: PenLine, tile: SUCCESS_TILE },
  blocked: { icon: Clock3, tile: WARNING_TILE },
  waiting: { icon: Users, tile: WARNING_TILE },
  conflicting: { icon: Split },
  stale: { icon: CalendarClock },
}

const StatusOptionIcon = ({ option }: { option: SpaceQueueStatusOption }): ReactElement => {
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

type StatusOptionsProps = {
  counts?: SpaceQueueCounts
  selected: SpaceQueueStatusOption[]
  onChange: (selected: SpaceQueueStatusOption[]) => void
}

const StatusOptions = ({ counts, selected, onChange }: StatusOptionsProps): ReactElement => {
  const toggle = (option: SpaceQueueStatusOption, checked: boolean) =>
    onChange(checked ? [...selected, option] : selected.filter((other) => other !== option))

  const renderOption = (option: SpaceQueueStatusOption) => (
    <DropdownMenuCheckboxItem
      key={option}
      checked={selected.includes(option)}
      onCheckedChange={(checked) => toggle(option, checked)}
    >
      <StatusOptionIcon option={option} />
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

export default StatusOptions
