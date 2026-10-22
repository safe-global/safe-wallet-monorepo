import { useState, type ReactNode } from 'react'
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
import { getAccount, getTypeLabel, TYPE_LABELS } from '../../services/model'
import type { Account, Filter } from '../../types'
import { chainLogoUrl, FLAG_META, FLAGS, RECOVERY_TYPE, STATUS_META, TYPE_ICONS } from '../shared'
import { matchesFlag, type QueueFilterState } from './useQueueFilters'

const APPLIED_PILL = 'h-7 bg-card pr-2.5 pl-3 shadow-xs transition-colors hover:bg-muted'
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
}

export type AppliedPill = { section: string; title: string; values: string[]; clear: () => void }

// Statuses in section order.
const STEPS_STATUSES: { status: Filter; label: string }[] = [
  { status: 'ready', label: 'Execute' },
  { status: 'sign', label: 'Sign' },
  { status: 'waiting', label: 'Blocked' },
  { status: 'awaiting', label: 'Waiting' },
]

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
      {/* Flags narrow the statuses above. They do not add to them. */}
      <DropdownMenuSeparator />
      {FLAGS.map((flag) => {
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

function StatusDropdown({ filters }: Pick<QueueFiltersProps, 'filters'>) {
  const selected = [
    ...STEPS_STATUSES.filter(({ status }) => filters.stateFilter.includes(status)).map(({ label }) => label),
    ...FLAGS.filter((flag) => filters.flags.includes(flag)).map((flag) => FLAG_META[flag].short),
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
  const shown = query ? accounts.filter((account) => account.name.toLowerCase().includes(query)) : accounts
  return (
    <>
      {accounts.length >= SAFE_SEARCH_FROM && (
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
      {shown.map((account) => (
        <FilterOption
          key={account.id}
          label={account.name}
          checked={filters.accountFilter.includes(account.id)}
          count={filters.optionCount('accounts', (tx) => tx.account === account.id)}
          icon={<Identicon address={account.iconAddress} size={16} />}
          onToggle={() => filters.toggleAccount(account.id)}
        />
      ))}
      {query && !shown.length && <p className="px-2 py-1.5 text-sm text-muted-foreground">No Safes match</p>}
    </>
  )
}

export function QueueToolbar({ filters, accounts, hasItems, extraMenu }: QueueFiltersProps) {
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
      {hasItems && <StatusDropdown filters={filters} />}
      {hasItems && <SafeDropdown filters={filters} accounts={accounts} />}
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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          extra.forEach((pill) => pill.clear())
          filters.reset()
        }}
      >
        Clear
      </Button>
    </div>
  )
}
