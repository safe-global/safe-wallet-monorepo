import type { ReactNode } from 'react'
import { Check, ListFilter } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { getAccount, getTypeLabel, matchesFilter, TYPE_LABELS } from '../../services/model'
import type { Account, Persona } from '../../types'
import { chainLogoUrl, QUICK_FILTERS, STATUS_META, STATUS_ORDER, TYPE_ICONS, type GroupBy } from '../shared'
import type { QueueFilterState } from './useQueueFilters'

const APPLIED_PILL = 'h-7 bg-card pr-2.5 pl-3 shadow-xs transition-colors hover:bg-muted'
const GROUPING_LABELS: Record<Exclude<GroupBy, 'none'>, string> = { safe: 'Safe', status: 'Status' }

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
  persona: Persona
  hasItems: boolean
  groupBy: GroupBy
  onGroupByChange: (groupBy: GroupBy) => void
}

export function QueueToolbar({ filters, accounts, persona, hasItems, groupBy, onGroupByChange }: QueueFiltersProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <SearchInput
        className="min-w-48 flex-1"
        aria-label="Find a proposal"
        placeholder="Search transactions…"
        value={filters.search}
        onChange={(event) => filters.setSearch(event.target.value)}
        onClear={() => filters.setSearch('')}
      />
      {hasItems && (
        <div role="group" aria-label="Quick filters" className="flex flex-wrap items-center gap-2">
          {QUICK_FILTERS.map((status) => {
            const meta = STATUS_META[status]
            const count = filters.optionCount('statuses', (tx) => matchesFilter(tx, status, persona))
            const pressed = filters.stateFilter.includes(status)
            return (
              <Tooltip key={status} delay={300}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-pressed={pressed}
                      aria-label={`${meta.label}, ${count}`}
                      onClick={() => filters.toggleStatus(status)}
                      className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border bg-card pr-3 pl-1.5 text-sm shadow-xs outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 ${pressed ? 'border-foreground' : 'border-border'}`}
                    />
                  }
                >
                  <span className={`flex size-6 items-center justify-center rounded ${meta.tone}`} aria-hidden="true">
                    <meta.icon className="size-3.5" strokeWidth={ICON_STROKE} />
                  </span>
                  {meta.label}
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </TooltipTrigger>
                <TooltipContent>{meta.description}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          <ListFilter />
          Filter
          {filters.applied.length > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {filters.applied.length}
              <span className="sr-only"> applied</span>
            </Badge>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FilterSectionTitle title="Safe account" summary={filters.summaries.accounts} />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              {accounts.map((account) => (
                <FilterOption
                  key={account.id}
                  label={account.name}
                  checked={filters.accountFilter.includes(account.id)}
                  count={filters.optionCount('accounts', (tx) => tx.account === account.id)}
                  icon={<Identicon address={account.iconAddress} size={16} />}
                  onToggle={() => filters.toggleAccount(account.id)}
                />
              ))}
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
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
                    count={filters.optionCount('statuses', (tx) => matchesFilter(tx, status, persona))}
                    icon={<StatusIcon className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
                    onToggle={() => filters.toggleStatus(status)}
                  />
                )
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
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
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="action" aria-label="New transaction">
        New
      </Button>
    </div>
  )
}

export function AppliedFilters({
  filters,
  groupBy,
  onGroupByChange,
}: Pick<QueueFiltersProps, 'filters' | 'groupBy' | 'onGroupByChange'>) {
  const pills = [
    ...filters.applied,
    ...(groupBy === 'none'
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
          onGroupByChange('none')
        }}
      >
        Clear
      </Button>
    </div>
  )
}
