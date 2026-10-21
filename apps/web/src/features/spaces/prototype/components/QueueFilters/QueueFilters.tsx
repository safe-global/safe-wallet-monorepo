import type { ReactNode } from 'react'
import { Check, ChevronDown, Info, LifeBuoy, ListFilter, Plus } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Chip } from '@safe-global/views/components/ui/chip'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import Identicon from '@/components/common/Identicon'
import { getAccount, getConflicts, getTypeLabel, TYPE_LABELS } from '../../services/model'
import type { Account, Filter } from '../../types'
import {
  chainLogoUrl,
  CONFLICTING_META,
  QUICK_FILTERS,
  RECOVERY_TYPE,
  STATUS_META,
  STATUS_ORDER,
  TYPE_ICONS,
  type GroupBy,
} from '../shared'
import type { QueueFilterState } from './useQueueFilters'

const APPLIED_PILL = 'h-7 bg-card pr-2.5 pl-3 shadow-xs transition-colors hover:bg-muted'
const GROUPING_LABELS: Record<Exclude<GroupBy, 'none'>, string> = { safe: 'Safe', status: 'Status' }
const GROUPING_OPTIONS: { value: GroupBy; label: string; hint: string }[] = [
  { value: 'safe', label: 'Safe', hint: 'Safe view' },
  { value: 'status', label: 'Status', hint: 'Status view' },
  { value: 'none', label: 'List', hint: 'Every proposal in one list' },
]

function FilterOption({
  label,
  checked,
  count,
  icon,
  onToggle,
}: {
  label: string
  checked: boolean
  count: number
  icon: ReactNode
  onToggle: () => void
}) {
  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onCheckedChange={onToggle}
      className="group/option pr-2 [&>[data-slot=dropdown-menu-checkbox-item-indicator]]:hidden"
    >
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center rounded border border-border opacity-0 group-data-[highlighted]/option:opacity-100 group-data-[checked]/option:border-primary group-data-[checked]/option:bg-primary group-data-[checked]/option:text-primary-foreground group-data-[checked]/option:opacity-100"
      >
        {/* The menu item recolours every child on focus; the check must stay white on the filled box. */}
        {checked && <Check className="size-3 text-primary-foreground!" />}
      </span>
      <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </DropdownMenuCheckboxItem>
  )
}

function FilterSectionTitle({ title, summary }: { title: string; summary?: string }) {
  return (
    <span className="flex flex-1 items-center gap-2 pr-2">
      {title}
      {summary && (
        <>
          <span className="size-1.5 rounded-full bg-success-strong" aria-hidden="true" />
          <Badge variant="secondary" className="ml-auto font-normal" aria-hidden="true">
            {summary}
          </Badge>
        </>
      )}
    </span>
  )
}

type QueueFiltersProps = {
  filters: QueueFilterState
  accounts: Account[]
  hasItems: boolean
  groupBy: GroupBy
  onGroupByChange: (groupBy: GroupBy) => void
  // Next steps: grouping is a view setting, not a filter.
  groupingAsView?: boolean
  // One table: always by Safe. The Status and Safe filters cover the other view.
  hideViewSwitch?: boolean
}

// Next steps statuses, in section order.
const STEPS_STATUSES: { status: Filter; label: string }[] = [
  { status: 'ready', label: 'Execute' },
  { status: 'sign', label: 'Sign' },
  { status: 'waiting', label: 'Blocked' },
  { status: 'awaiting', label: 'Waiting' },
]

const VIEWS = GROUPING_OPTIONS.filter((option) => option.value !== 'none')

// Next steps: a switch between the two views.
function ViewSwitch({ groupBy, onGroupByChange }: Pick<QueueFiltersProps, 'groupBy' | 'onGroupByChange'>) {
  return (
    <div
      role="radiogroup"
      aria-label="View"
      className="flex h-9 items-center gap-0.5 rounded-md border border-border bg-card p-[3px] shadow-xs"
    >
      {VIEWS.map((option) => {
        const active = groupBy === option.value
        return (
          <Tooltip key={option.value} delay={300}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onGroupByChange(option.value)}
                  className={`h-full cursor-pointer rounded-[8px] px-3 text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                />
              }
            >
              {option.label}
            </TooltipTrigger>
            <TooltipContent>{option.hint}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

function ToolbarDropdown({
  label,
  tooltip,
  selected,
  onClear,
  footer,
  children,
}: {
  label: string
  tooltip: string
  selected: string[]
  onClear: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <DropdownMenu>
      <Tooltip delay={300}>
        <TooltipTrigger render={<DropdownMenuTrigger render={<Button variant="outline" />} />}>
          {label}
          <ChevronDown className="text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-60">
        {children}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear}>
              <span className="flex-1">Clear</span>
              <span className="text-xs tabular-nums text-muted-foreground">{selected.length} selected</span>
            </DropdownMenuItem>
          </>
        )}
        {footer && (
          <>
            <DropdownMenuSeparator />
            {footer}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function StepsStatusOptions({ filters }: Pick<QueueFiltersProps, 'filters'>) {
  return (
    <>
      {STEPS_STATUSES.map(({ status, label }) => {
        const meta = STATUS_META[status]
        return (
          <FilterOption
            key={status}
            label={label}
            checked={filters.stateFilter.includes(status)}
            count={filters.optionCount('statuses', (tx) => filters.matches(tx, status))}
            icon={
              <span className={`flex size-4 items-center justify-center rounded ${meta.tone}`}>
                <meta.icon className="size-3" strokeWidth={ICON_STROKE} />
              </span>
            }
            onToggle={() => filters.toggleStatus(status)}
          />
        )
      })}
      {/* Conflicting narrows the statuses above. It does not add to them. */}
      <DropdownMenuSeparator />
      <FilterOption
        label={CONFLICTING_META.short}
        checked={filters.conflicting}
        count={filters.optionCount('conflicting', (tx) => getConflicts(tx, filters.items).length > 0)}
        icon={<CONFLICTING_META.icon className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
        onToggle={filters.toggleConflicting}
      />
    </>
  )
}

function StatusDropdown({ filters }: Pick<QueueFiltersProps, 'filters'>) {
  const selected = [
    ...STEPS_STATUSES.filter(({ status }) => filters.stateFilter.includes(status)).map(({ label }) => label),
    ...(filters.conflicting ? [CONFLICTING_META.short] : []),
  ]
  return (
    <ToolbarDropdown
      label="Status"
      tooltip="Filter by Status"
      selected={selected}
      onClear={() => filters.applied.find((filter) => filter.section === 'statuses')?.clear()}
    >
      <StepsStatusOptions filters={filters} />
    </ToolbarDropdown>
  )
}

function SafeDropdown({ filters, accounts }: Pick<QueueFiltersProps, 'filters' | 'accounts'>) {
  return (
    <ToolbarDropdown
      label="Safe"
      tooltip="Filter by Safe"
      selected={accounts.filter((account) => filters.accountFilter.includes(account.id)).map((account) => account.name)}
      onClear={() => filters.applied.find((filter) => filter.section === 'accounts')?.clear()}
      footer={
        <Tooltip delay={150}>
          <TooltipTrigger
            render={
              <div className="flex cursor-default items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground" />
            }
          >
            <Info className="size-3.5" strokeWidth={ICON_STROKE} aria-hidden="true" />
            Sorted by actionable transactions
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-64 whitespace-normal">
            Safes you can execute or sign on come first, most urgent at the top. Safes with nothing for you keep the
            workspace order.
          </TooltipContent>
        </Tooltip>
      }
    >
      <SafeAccountOptions filters={filters} accounts={accounts} />
    </ToolbarDropdown>
  )
}

function SafeAccountOptions({ filters, accounts }: Pick<QueueFiltersProps, 'filters' | 'accounts'>) {
  return accounts.map((account) => (
    <FilterOption
      key={account.id}
      label={account.name}
      checked={filters.accountFilter.includes(account.id)}
      count={filters.optionCount('accounts', (tx) => tx.account === account.id)}
      icon={<Identicon address={account.iconAddress} size={16} />}
      onToggle={() => filters.toggleAccount(account.id)}
    />
  ))
}

export function QueueToolbar({
  filters,
  accounts,
  hasItems,
  groupBy,
  onGroupByChange,
  groupingAsView,
  hideViewSwitch,
}: QueueFiltersProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <SearchInput
        className="min-w-48 flex-1"
        aria-label="Find a proposal"
        placeholder="Search Safes and transactions…"
        value={filters.search}
        onChange={(event) => filters.setSearch(event.target.value)}
        onClear={() => filters.setSearch('')}
      />
      {groupingAsView && (
        <>
          {!hideViewSwitch && <ViewSwitch groupBy={groupBy} onGroupByChange={onGroupByChange} />}
          {/* The Status view already splits by status. */}
          {hasItems && groupBy !== 'status' && <StatusDropdown filters={filters} />}
          {hasItems && <SafeDropdown filters={filters} accounts={accounts} />}
        </>
      )}
      {hasItems && !groupingAsView && (
        <div role="group" aria-label="Quick filters" className="flex flex-wrap items-center gap-2">
          {QUICK_FILTERS.map((status) => ({ status, label: STATUS_META[status].label })).map(({ status, label }) => {
            const meta = STATUS_META[status]
            const count = filters.optionCount('statuses', (tx) => filters.matches(tx, status))
            const pressed = filters.stateFilter.includes(status)
            return (
              <Tooltip key={status} delay={300}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-pressed={pressed}
                      aria-label={`${label}, ${count}`}
                      onClick={() => filters.toggleStatus(status)}
                      className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border bg-card pr-3 pl-1.5 text-sm shadow-xs outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 ${pressed ? 'border-foreground' : 'border-border'}`}
                    />
                  }
                >
                  <span className={`flex size-6 items-center justify-center rounded ${meta.tone}`} aria-hidden="true">
                    <meta.icon className="size-3.5" strokeWidth={ICON_STROKE} />
                  </span>
                  {label}
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </TooltipTrigger>
                <TooltipContent>{meta.description}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      )}
      <DropdownMenu>
        <Tooltip delay={300}>
          <TooltipTrigger render={<DropdownMenuTrigger render={<Button variant="outline" />} />}>
            <ListFilter />
            Filter
          </TooltipTrigger>
          <TooltipContent>All filters</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-60">
          {groupingAsView && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FilterSectionTitle title="Status" summary={filters.summaries.statuses} />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-60">
                <StepsStatusOptions filters={filters} />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FilterSectionTitle title="Safe account" summary={filters.summaries.accounts} />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <SafeAccountOptions filters={filters} accounts={accounts} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FilterSectionTitle title="Network" summary={filters.summaries.networks} />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {filters.networks.map((network) => (
                <FilterOption
                  key={network}
                  label={network}
                  checked={filters.networkFilter.includes(network)}
                  count={filters.optionCount('networks', (tx) => getAccount(tx).network === network)}
                  icon={
                    <Avatar className="size-4">
                      <AvatarImage
                        src={chainLogoUrl(accounts.find((account) => account.network === network)?.chainId)}
                        alt=""
                      />
                      <AvatarFallback className="text-[10px]">{network[0]}</AvatarFallback>
                    </Avatar>
                  }
                  onToggle={() => filters.toggleNetwork(network)}
                />
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FilterSectionTitle title="Type" summary={filters.summaries.types} />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-60">
              {TYPE_LABELS.map((type) => {
                const TypeIcon = TYPE_ICONS[type]
                return (
                  <FilterOption
                    key={type}
                    label={type}
                    checked={filters.typeFilter.includes(type)}
                    count={filters.optionCount('types', (tx) => getTypeLabel(tx) === type)}
                    icon={<TypeIcon className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
                    onToggle={() => filters.toggleType(type)}
                  />
                )
              })}
              {groupingAsView && (
                <FilterOption
                  label={RECOVERY_TYPE}
                  checked={filters.typeFilter.includes(RECOVERY_TYPE)}
                  count={filters.recoveryCount}
                  icon={<LifeBuoy className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
                  onToggle={() => filters.toggleType(RECOVERY_TYPE)}
                />
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {!groupingAsView && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FilterSectionTitle title="Status" summary={filters.summaries.statuses} />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                {STATUS_ORDER.map((status) => {
                  const StatusIcon = STATUS_META[status].icon
                  return (
                    <FilterOption
                      key={status}
                      label={STATUS_META[status].label}
                      checked={filters.stateFilter.includes(status)}
                      count={filters.optionCount('statuses', (tx) => filters.matches(tx, status))}
                      icon={<StatusIcon className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
                      onToggle={() => filters.toggleStatus(status)}
                    />
                  )
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {!groupingAsView && <DropdownMenuSeparator />}
          {!groupingAsView && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FilterSectionTitle
                  title="Group by"
                  summary={groupBy === 'none' ? undefined : GROUPING_LABELS[groupBy]}
                />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuRadioGroup value={groupBy} onValueChange={(value) => onGroupByChange(value as GroupBy)}>
                  <DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="safe">Safe</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {filters.applied.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => filters.applied.forEach((filter) => filter.clear())}>
                <span className="flex-1">Reset all filters</span>
                <span className="text-xs tabular-nums text-muted-foreground">{filters.applied.length} applied</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip delay={300}>
        <TooltipTrigger render={<Button size="action" aria-label="New transaction" />}>
          <Plus className="text-green-500" aria-hidden="true" />
          New
        </TooltipTrigger>
        <TooltipContent>New transaction</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function AppliedFilters({
  filters,
  groupBy,
  onGroupByChange,
  groupingAsView,
}: Pick<QueueFiltersProps, 'filters' | 'groupBy' | 'onGroupByChange' | 'groupingAsView'>) {
  const pills = [
    ...filters.applied,
    ...(groupBy === 'none' || groupingAsView
      ? []
      : [
          {
            section: 'grouping',
            title: 'Group by',
            values: [GROUPING_LABELS[groupBy]],
            clear: () => onGroupByChange('none'),
          },
        ]),
  ]
  if (!pills.length) return null
  return (
    <div role="group" aria-label="Applied filters" className="-mt-2 mb-5 flex flex-wrap items-center gap-2">
      {pills.map((filter) => (
        <Chip key={filter.section} variant="outline" size="lg" onDelete={filter.clear} className={APPLIED_PILL}>
          <span className="text-muted-foreground">{filter.title}:</span>
          {filter.values.length > 2
            ? `${filter.values.slice(0, 2).join(', ')} +${filter.values.length - 2}`
            : filter.values.join(', ')}
        </Chip>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          filters.reset()
          if (!groupingAsView) onGroupByChange('none')
        }}
      >
        Clear
      </Button>
    </div>
  )
}
