import { Fragment, type ReactElement, type ReactNode } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Info, ListFilter, Rows3 } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Chip } from '@safe-global/views/components/ui/chip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'

// Copies of the Workspace queue's toolbar (packages/views/…/SpaceQueue on dev), adapted to policies.

/** The queue's FilterOptionItem: a checkbox row with an icon and, when given, a count. */
const FilterOptionItem = ({
  icon,
  label,
  count,
  checked,
  onToggle,
}: {
  icon?: ReactNode
  label: ReactNode
  count?: number
  checked: boolean
  onToggle: () => void
}): ReactElement => (
  <DropdownMenuCheckboxItem checked={checked} onCheckedChange={onToggle}>
    {icon}
    <span className="truncate">{label}</span>
    {count !== undefined && <span className="ml-auto pl-6 text-muted-foreground tabular-nums">{count}</span>}
  </DropdownMenuCheckboxItem>
)

export type FilterOption = { value: string; label: string; icon?: ReactNode; count: number }

export type FilterSection = {
  key: string
  /** The submenu's name and the chip's label. */
  label: string
  /** The chip names an option by this instead of its menu label, e.g. "Ready to execute" for "Ready". */
  chipLabels?: Record<string, string>
  options: FilterOption[]
  /** Listed after the options, apart, like the queue's "Sorted by number of transactions". */
  note?: string
  /** Breaks the list after these options, like the queue's statuses and flags. */
  separatorAfter?: string[]
  selected: string[]
  onToggle: (value: string) => void
}

/** The queue's FilterMenu: one submenu per filter. */
const FilterMenu = ({ sections }: { sections: FilterSection[] }): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" />}>
      <ListFilter />
      Filter
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-44" data-m2-new="Queue copy · Filter menu">
      {sections.map(({ key, label, options, note, separatorAfter = [], selected, onToggle }) => (
        <DropdownMenuSub key={key}>
          <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-60">
            {options.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No {label.toLowerCase()}s</p>
            ) : (
              options.map(({ value, label: optionLabel, icon, count }) => (
                <Fragment key={value}>
                  <FilterOptionItem
                    icon={icon}
                    label={optionLabel}
                    count={count}
                    checked={selected.includes(value)}
                    onToggle={() => onToggle(value)}
                  />
                  {separatorAfter.includes(value) && <DropdownMenuSeparator />}
                </Fragment>
              ))
            )}
            {note && (
              <>
                <DropdownMenuSeparator />
                <p className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5" />
                  {note}
                </p>
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

const MAX_CHIP_VALUES = 2

/** The queue's FilterChip with its `filter` look, which this branch's Chip doesn't have yet. */
const FilterChip = ({ label, values, onDelete }: { label: string; values: string[]; onDelete: () => void }) => {
  const shown = values.slice(0, MAX_CHIP_VALUES)
  const hidden = values.length - shown.length
  return (
    <Chip
      variant="outline"
      size="lg"
      onDelete={onDelete}
      // eslint-disable-next-line no-restricted-syntax -- dev's Chip `filter` variant and `xl` size, copied until this branch has them
      className="h-7 bg-card pr-2.5 pl-3 text-sm shadow-xs transition-colors hover:bg-muted"
    >
      <span className="text-muted-foreground">{label}:</span>
      {shown.map((value, index) => (
        <Fragment key={value}>
          {index > 0 && ', '}
          {value}
        </Fragment>
      ))}
      {hidden > 0 && ` +${hidden}`}
    </Chip>
  )
}

/** The queue's FilterChips: one chip per filter in use, naming up to two values, and Clear. */
const FilterChips = ({
  sections,
  onClear,
}: {
  sections: FilterSection[]
  onClear: () => void
}): ReactElement | null => {
  const used = sections.filter(({ selected }) => selected.length > 0)
  if (used.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2" data-m2-new="Queue copy · Filter chips">
      {used.map(({ key, label, options, chipLabels, selected, onToggle }) => (
        <FilterChip
          key={key}
          label={label}
          values={selected.map(
            (value) => chipLabels?.[value] ?? options.find((option) => option.value === value)?.label ?? value,
          )}
          onDelete={() => selected.forEach(onToggle)}
        />
      ))}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  )
}

export type GroupByOption<T extends string> = { value: T; label: string; hint: string }

/** The queue's QueueGroupByMenu. */
const GroupByMenu = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: GroupByOption<T>[]
  value: T
  onChange: (value: T) => void
}): ReactElement => {
  const selected = options.find((option) => option.value === value) ?? options[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" aria-label={`Group by ${selected.label}`} />}>
        <Rows3 />
        Group by: {selected.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72" data-m2-new="Queue copy · Group by menu">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Group by</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <span className="flex flex-col">
                  {option.label}
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The queue's QueueToolbar: search, Group by, Filter and the action, with the chips below. */
export const PolicyToolbar = <T extends string>({
  search,
  groupBy,
  sections,
  onClear,
  action,
}: {
  search: ReactNode
  groupBy: { options: GroupByOption<T>[]; value: T; onChange: (value: T) => void }
  sections: FilterSection[]
  onClear: () => void
  action: ReactNode
}): ReactElement => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-2">
      {search}
      <GroupByMenu {...groupBy} />
      <FilterMenu sections={sections} />
      {action}
    </div>
    <FilterChips sections={sections} onClear={onClear} />
  </div>
)

/** The queue's CollapseAllButton, icon only beside its column's title; the label is its tooltip. */
export const CollapseAllButton = ({
  allCollapsed,
  count,
  onToggle,
}: {
  allCollapsed: boolean
  count: number
  onToggle: () => void
}): ReactElement => {
  const label = `${allCollapsed ? 'Expand' : 'Collapse'} ${count} ${count === 1 ? 'group' : 'groups'}`
  return (
    <Tooltip>
      <TooltipTrigger render={<Button size="icon-xs" variant="ghost-muted" aria-label={label} onClick={onToggle} />}>
        {allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
      </TooltipTrigger>
      <TooltipContent className="normal-case">{label}</TooltipContent>
    </Tooltip>
  )
}
