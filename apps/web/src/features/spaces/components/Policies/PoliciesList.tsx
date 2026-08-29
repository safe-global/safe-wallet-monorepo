import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SearchField from '@/components/common/SearchField'
import TableCard from '@/components/common/TableCard'
import PoliciesTable from './PoliciesTable'
import {
  PoliciesNoSearchResults,
  PoliciesTableError,
  PoliciesTableLoading,
} from './PoliciesTable/components/PoliciesTableStates'
import usePolicySearch from './hooks/usePolicySearch'
import { DEFAULT_POLICY_SORT, POLICY_SORT_OPTIONS, sortPolicies, type PolicySortOption } from './utils/policySort'
import type { Policy } from './types'

export type PoliciesListProps = {
  policies: Policy[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** Opens the create-policy flow. The caller is responsible for requiring a connected wallet. */
  onAddPolicy?: () => void
  onSelectPolicy?: (policy: Policy) => void
}

/**
 * The Policies page once the space has policies: an Add policy button, a search field, a sort
 * control and the table.
 *
 * Search and sort run in the browser over the fixtures. WA-3451 moves both to the server, because
 * once CGW paginates the response a browser-side filter would only cover the current page.
 */
const PoliciesList = ({
  policies,
  isLoading = false,
  isError = false,
  onRetry,
  onAddPolicy,
  onSelectPolicy,
}: PoliciesListProps) => {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<PolicySortOption>(DEFAULT_POLICY_SORT)

  const matches = usePolicySearch(policies, query)
  const rows = useMemo(() => sortPolicies(matches, sort), [matches, sort])

  const renderTable = () => {
    if (isLoading) return <PoliciesTableLoading />
    if (isError) return <PoliciesTableError onRetry={onRetry} />
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

        <SearchField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="by name, address or network"
          className="flex-1"
          data-testid="policies-search"
        />

        <Select value={sort} onValueChange={(value) => setSort(value as PolicySortOption)}>
          <SelectTrigger className="shrink-0 sm:w-44" aria-label="Sort policies" data-testid="policies-sort">
            <SelectValue />
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

      <TableCard>{renderTable()}</TableCard>
    </div>
  )
}

export default PoliciesList
