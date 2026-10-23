import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Info, LifeBuoy, ListFilter, Plus, Search, X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Chip } from '@safe-global/views/components/ui/chip'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@safe-global/views/components/ui/input-group'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import Identicon from '@/components/common/Identicon'
import { getAccount, getTypeLabel, TYPE_LABELS } from '../../services/model'
import type { Account, Filter } from '../../types'
import { chainLogoUrl, FLAG_META, FLAGS, RECOVERY_TYPE, STATUS_META, TYPE_ICONS, type Flag } from '../shared'
import { matchesFlag, type QueueFilterState } from './useQueueFilters'

const APPLIED_PILL = 'h-7 bg-card pr-2.5 pl-3 shadow-xs transition-colors hover:bg-muted'
// Milestone 1 hides counts: they need queue service support across every Safe.
export const FilterCountsContext = createContext(true)

export function FilterOption({
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
  const showCounts = useContext(FilterCountsContext)
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
      {showCounts && <span className="text-xs tabular-nums text-muted-foreground">{count}</span>}
    </DropdownMenuCheckboxItem>
  )
}

export function FilterSectionTitle({ title, summary }: { title: string; summary?: string }) {
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
  // Fleet admin: more sections in the Filter menu, after Type.
  extraMenu?: ReactNode
  // Option C: Safe and Status only, with four statuses.
  simple?: boolean
  // When the queue was fetched, before New.
  status?: ReactNode
}

export type AppliedPill = { section: string; title: string; values: string[]; clear: () => void }

// Statuses in section order.
const STEPS_STATUSES: { status: Filter; label: string }[] = [
  { status: 'ready', label: 'Execute' },
  { status: 'sign', label: 'Sign' },
  { status: 'waiting', label: 'Blocked' },
  { status: 'awaiting', label: 'Waiting' },
]
const SIMPLE_STATUSES: { status: Filter; label: string }[] = [
  { status: 'sign', label: 'Needs your signature' },
  { status: 'ready', label: 'Ready to execute' },
  { status: 'waiting', label: 'Blocked' },
]
const SIMPLE_FLAGS: Flag[] = ['conflicting']

export function ToolbarDropdown({
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

function StepsStatusOptions({ filters, simple }: Pick<QueueFiltersProps, 'filters' | 'simple'>) {
  return (
    <>
      {(simple ? SIMPLE_STATUSES : STEPS_STATUSES).map(({ status, label }) => {
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
      {/* Flags narrow the statuses above. They do not add to them. */}
      <DropdownMenuSeparator />
      {(simple ? SIMPLE_FLAGS : FLAGS).map((flag) => {
        const meta = FLAG_META[flag]
        return (
          <FilterOption
            key={flag}
            label={meta.short}
            checked={filters.flags.includes(flag)}
            count={filters.optionCount('flags', (tx) => matchesFlag(tx, flag, filters.items))}
            icon={<meta.icon className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
            onToggle={() => filters.toggleFlag(flag)}
          />
        )
      })}
    </>
  )
}

function StatusDropdown({ filters, simple }: Pick<QueueFiltersProps, 'filters' | 'simple'>) {
  const selected = [
    ...(simple ? SIMPLE_STATUSES : STEPS_STATUSES)
      .filter(({ status }) => filters.stateFilter.includes(status))
      .map(({ label }) => label),
    ...FLAGS.filter((flag) => filters.flags.includes(flag)).map((flag) => FLAG_META[flag].short),
  ]
  return (
    <ToolbarDropdown
      label="Status"
      tooltip="Filter by Status"
      selected={selected}
      onClear={() => filters.applied.find((filter) => filter.section === 'statuses')?.clear()}
    >
      <StepsStatusOptions filters={filters} simple={simple} />
    </ToolbarDropdown>
  )
}

function SafeDropdown({ filters, accounts }: Pick<QueueFiltersProps, 'filters' | 'accounts'>) {
  return (
    <ToolbarDropdown
      label="Safe"
      tooltip="Filter by Safe"
      selected={filters.accountNames}
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
            Safes you can act on come first, most urgent first, then the one waiting longest. The rest keep your
            workspace order. The order updates when you reload or change filters.
          </TooltipContent>
        </Tooltip>
      }
    >
      <SafeAccountOptions filters={filters} accounts={accounts} />
    </ToolbarDropdown>
  )
}

// Same search-in-menu pattern as the production network picker (ChainSelectorBlock).
const SAFE_SEARCH_FROM = 6

function SafeAccountOptions({ filters, accounts }: Pick<QueueFiltersProps, 'filters' | 'accounts'>) {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const { safes } = filters
  const shown = query ? safes.filter((safe) => safe.name.toLowerCase().includes(query)) : safes
  return (
    <>
      {safes.length >= SAFE_SEARCH_FROM && (
        <SearchInput
          variant="surface"
          className="m-1 w-[calc(100%-0.5rem)]"
          placeholder="Search Safes"
          aria-label="Search Safes"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          // The menu takes every printable key for its typeahead. Escape still closes it.
          onKeyDown={(event) => event.key !== 'Escape' && event.stopPropagation()}
          autoComplete="off"
        />
      )}
      {shown.map((safe) => (
        <FilterOption
          key={safe.ids[0]}
          label={safe.name}
          checked={safe.ids.every((id) => filters.accountFilter.includes(id))}
          count={filters.optionCount('accounts', (tx) => safe.ids.includes(tx.account))}
          icon={<Identicon address={accounts.find((account) => account.id === safe.ids[0])!.iconAddress} size={16} />}
          onToggle={() => filters.toggleSafe(safe.ids)}
        />
      ))}
      {query && !shown.length && <p className="px-2 py-1.5 text-sm text-muted-foreground">No Safes match</p>}
    </>
  )
}

// SearchInput's field, with Apply filter beside the clear button when the text names a filter. Enter does the same.
function QueueSearch({ filters }: Pick<QueueFiltersProps, 'filters'>) {
  const match = filters.searchMatch
  return (
    <InputGroup variant="search" className="min-w-48 flex-1 @max-[640px]:basis-full">
      <InputGroupAddon align="inline-start">
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label="Find a proposal"
        placeholder="Search Safes, networks, status, and signers…"
        className="[&::-webkit-search-cancel-button]:hidden"
        value={filters.search}
        onChange={(event) => filters.setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || !match) return
          event.preventDefault()
          match.apply()
        }}
      />
      {filters.search && (
        <InputGroupAddon align="inline-end">
          {match && (
            <Tooltip delay={150}>
              <TooltipTrigger
                render={
                  <InputGroupButton
                    variant="ghost"
                    aria-label={`Apply filter, ${match.title}: ${match.labels.join(', ')}`}
                    onClick={match.apply}
                  />
                }
              >
                <span className="text-xs">Apply filter</span>
                <Kbd className="h-6 min-w-6 px-1.5 text-sm">Enter</Kbd>
              </TooltipTrigger>
              <TooltipContent>
                {match.title}: {match.labels.join(', ')}
              </TooltipContent>
            </Tooltip>
          )}
          <InputGroupButton
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => filters.setSearch('')}
          >
            <X className="pointer-events-none size-4" strokeWidth={ICON_STROKE} />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export function QueueToolbar({ filters, accounts, hasItems, extraMenu, simple, status }: QueueFiltersProps) {
  return (
    // Under 640px of content, search takes its own row and the buttons go below.
    <div className="@container mb-5">
      <div className="flex flex-wrap items-center gap-3">
        <QueueSearch filters={filters} />
        {hasItems && <StatusDropdown filters={filters} simple={simple} />}
        {hasItems && <SafeDropdown filters={filters} accounts={accounts} />}
        {!simple && (
          <DropdownMenu>
            <Tooltip delay={300}>
              <TooltipTrigger render={<DropdownMenuTrigger render={<Button variant="outline" />} />}>
                <ListFilter />
                Filter
              </TooltipTrigger>
              <TooltipContent>All filters</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FilterSectionTitle title="Status" summary={filters.summaries.statuses} />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-60">
                  <StepsStatusOptions filters={filters} />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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
                  <FilterOption
                    label={RECOVERY_TYPE}
                    checked={filters.typeFilter.includes(RECOVERY_TYPE)}
                    count={filters.recoveryCount}
                    icon={<LifeBuoy className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
                    onToggle={() => filters.toggleType(RECOVERY_TYPE)}
                  />
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
              {extraMenu}
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
        )}
        {status}
        <Tooltip delay={300}>
          <TooltipTrigger
            render={<Button size="action" aria-label="New transaction" className="@max-[640px]:ml-auto" />}
          >
            <Plus className="text-green-500" aria-hidden="true" />
            New
          </TooltipTrigger>
          <TooltipContent>New transaction</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export function AppliedFilters({
  filters,
  extra = [],
  hidden = [],
  actions,
}: Pick<QueueFiltersProps, 'filters'> & {
  // Fleet admin: the pulse counter and signer filters show here too.
  extra?: AppliedPill[]
  // Fleet admin: values a selected card already shows, so they get no pill.
  hidden?: string[]
  actions?: ReactNode
}) {
  const pills = [
    ...extra,
    ...filters.applied
      .map((pill) => ({ ...pill, values: pill.values.filter((value) => !hidden.includes(value)) }))
      .filter((pill) => pill.values.length > 0),
  ]
  const clearAll = () => {
    extra.forEach((pill) => pill.clear())
    filters.reset()
  }
  // Esc clears the filters, unless it's closing a drawer, menu or dialog, or editing a field.
  useEffect(() => {
    if (!pills.length) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]'))
        return
      if (document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) return
      clearAll()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })
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
      {actions}
      <Tooltip delay={300}>
        <TooltipTrigger render={<Button variant="ghost" size="2xs" className="-ml-1" onClick={clearAll} />}>
          Clear
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-1.5">
          Clear all filters <Kbd>Esc</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
