import type { ReactElement, ReactNode } from 'react'
import { ArrowDownUp, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TableCard from '@/components/common/TableCard'
import { PoliciesNoSearchResults } from './PoliciesTable/components/PoliciesTableStates'
import { POLICY_SORT_OPTIONS, type PolicySortOption } from './utils/policySort'
import type { Policy, PolicyType } from './types'

const POLICY_TYPE_FILTERS: { type: PolicyType; label: string }[] = [
  { type: 'spending-limit', label: 'Spending limits' },
  { type: 'proposer', label: 'Proposers' },
]

export type PoliciesListViewProps = {
  query: string
  onQueryChange: (query: string) => void
  sort: PolicySortOption | null
  onSortChange: (sort: PolicySortOption | null) => void
  typeFilter: PolicyType | null
  onTypeFilterChange: (typeFilter: PolicyType | null) => void
  /** Search matches before the type filter, counted per type on the filter chips. */
  matches: Policy[]
  hasRows: boolean
  table: ReactNode
  onAddPolicy?: () => void
}

export const PoliciesListView = ({
  query,
  onQueryChange,
  sort,
  onSortChange,
  typeFilter,
  onTypeFilterChange,
  matches,
  hasRows,
  table,
  onAddPolicy,
}: PoliciesListViewProps): ReactElement => {
  const renderTable = () => {
    if (!hasRows) return <PoliciesNoSearchResults query={query} />

    return table
  }

  return (
    <div className="flex flex-col gap-4" data-testid="policies-list">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={onAddPolicy} className="shrink-0" data-testid="add-policy-button">
          <Plus className="size-4 text-green-500" aria-hidden />
          Add policy
        </Button>

        <SearchInput
          variant="surface"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onClear={() => onQueryChange('')}
          placeholder="Search"
          aria-label="Search policies"
          autoComplete="off"
          className="flex-1"
          data-testid="policies-search"
        />

        <Select value={sort} onValueChange={(value) => onSortChange(value as PolicySortOption | null)}>
          <SelectTrigger
            className="shrink-0 data-[placeholder]:text-foreground sm:w-44"
            aria-label="Sort policies"
            data-testid="policies-sort"
          >
            <ArrowDownUp className="size-4 text-foreground" aria-hidden />
            <SelectValue>
              {(value: PolicySortOption | null) =>
                POLICY_SORT_OPTIONS.find((option) => option.value === value)?.label ?? 'Sort'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {POLICY_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Filter by policy type">
        <span className="text-sm text-muted-foreground">Filter by:</span>
        {POLICY_TYPE_FILTERS.map(({ type, label }) => {
          const isSelected = typeFilter === type
          const count = matches.filter((policy) => policy.type === type).length

          return (
            <Badge
              key={type}
              variant={isSelected ? 'default' : 'card'}
              size="chip"
              render={<button type="button" />}
              aria-pressed={isSelected}
              onClick={() => onTypeFilterChange(isSelected ? null : type)}
              className="cursor-pointer"
              data-testid={`policies-filter-${type}`}
            >
              {label}
              <span className={isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}>{count}</span>
            </Badge>
          )
        })}
      </div>

      <TableCard>{renderTable()}</TableCard>
    </div>
  )
}
