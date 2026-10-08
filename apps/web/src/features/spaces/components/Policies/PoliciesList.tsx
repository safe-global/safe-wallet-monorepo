import { useMemo, useState } from 'react'
import useChains from '@/hooks/useChains'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import PoliciesTable from './PoliciesTable'
import usePolicySearch from './hooks/usePolicySearch'
import {
  DEFAULT_POLICY_SORT,
  sortPolicies,
  type PolicySortContext,
  type PolicySortOption,
} from '@views/features/spaces/components/Policies/utils/policySort'
import type { Policy, PolicyType } from '@views/features/spaces/components/Policies/types'
import { PoliciesListView } from '@views/features/spaces/components/Policies/PoliciesListView'

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

  const { policies: matches, matchedSpenderNames } = usePolicySearch(policies, query)
  const rows = useMemo(() => {
    const filtered = typeFilter ? matches.filter((policy) => policy.type === typeFilter) : matches
    return sortPolicies(filtered, sort ?? DEFAULT_POLICY_SORT, sortContext)
  }, [matches, typeFilter, sort, sortContext])

  return (
    <PoliciesListView
      query={query}
      onQueryChange={setQuery}
      sort={sort}
      onSortChange={setSort}
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
      matches={matches}
      hasRows={rows.length > 0}
      table={<PoliciesTable policies={rows} matchedSpenderNames={matchedSpenderNames} onSelect={onSelectPolicy} />}
      onAddPolicy={onAddPolicy}
    />
  )
}

export default PoliciesList
