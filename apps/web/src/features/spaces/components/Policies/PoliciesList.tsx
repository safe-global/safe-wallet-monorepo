import { useMemo, useState } from 'react'
import { ArrowDownUp, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TableCard from '@/components/common/TableCard'
import useChains from '@/hooks/useChains'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import PoliciesTable from './PoliciesTable'
import { PoliciesNoSearchResults } from './PoliciesTable/components/PoliciesTableStates'
import usePolicySearch from './hooks/usePolicySearch'
import {
  DEFAULT_POLICY_SORT,
  POLICY_SORT_OPTIONS,
  sortPolicies,
  type PolicySortContext,
  type PolicySortOption,
} from './utils/policySort'
import type { Policy, PolicyType } from './types'

const POLICY_TYPE_FILTERS: { type: PolicyType; label: string }[] = [
  { type: 'spending-limit', label: 'Spending limits' },
  { type: 'proposer', label: 'Proposers' },
]

export type PoliciesListProps = {
  policies: Policy[]
  /** Opens the create-policy flow. The caller is responsible for requiring a connected wallet. */
  onAddPolicy?: () => void
  onSelectPolicy?: (policy: Policy) => void
}

/**
 * The Policies page once the space has policies: an Add policy button, a search field, a sort
 * control and the table. Search and sort run in the browser over the policies the caller passes.
 */
const PoliciesList = ({ policies, onAddPolicy, onSelectPolicy }: PoliciesListProps) => {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<PolicySortOption | null>(null)
  const [typeFilter, setTypeFilter] = useState<PolicyType | null>(null)

  const resolveSafeName = useSafeNameResolver()
  const { configs } = useChains()
  const sortContext = useMemo<PolicySortContext>(() => {
    const chainNames = new Map(configs.map((chain) => [chain.chainId, chain.chainName]))

    return {
      getSafeName: (safe) => resolveSafeName(safe.address, safe.chainId),
      getChainName: (chainId) => chainNames.get(chainId) ?? chainId,
    }
  }, [configs, resolveSafeName])

  const matches = usePolicySearch(policies, query)
  const rows = useMemo(() => {
    const filtered = typeFilter ? matches.filter((policy) => policy.type === typeFilter) : matches
    return sortPolicies(filtered, sort ?? DEFAULT_POLICY_SORT, sortContext)
  }, [matches, typeFilter, sort, sortContext])

  const renderTable = () => {
    if (rows.length === 0) return <PoliciesNoSearchResults query={query} />

    return <PoliciesTable policies={rows} onSelect={onSelectPolicy} />
  }

  return (
    <div className="flex flex-col gap-4" data-testid="policies-list">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={onAddPolicy} className="shrink-0" data-testid="add-policy-button">
          <Plus className="size-4" aria-hidden />
          Add policy
        </Button>

        <SearchInput
          variant="surface"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
          placeholder="by name, address or network"
          aria-label="Search policies"
          autoComplete="off"
          className="flex-1"
          data-testid="policies-search"
        />

        <Select value={sort} onValueChange={(value) => setSort(value as PolicySortOption | null)}>
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
              onClick={() => setTypeFilter(isSelected ? null : type)}
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

export default PoliciesList
