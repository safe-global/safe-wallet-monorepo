import { useMemo, useState } from 'react'
import { ArrowDownUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TableCard from '@/components/common/TableCard'
import useChains from '@/hooks/useChains'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import PoliciesTable from './PoliciesTable'
import { PoliciesNoSearchResults, PoliciesTabEmpty } from './PoliciesTable/components/PoliciesTableStates'
import usePolicySearch from './hooks/usePolicySearch'
import {
  DEFAULT_POLICY_SORT,
  POLICY_SORT_OPTIONS,
  sortPolicies,
  type PolicySortContext,
  type PolicySortOption,
} from './utils/policySort'
import type { Policy } from './types'

const POLICY_TABS = [
  { type: 'proposer', label: 'Proposers' },
  { type: 'spending-limit', label: 'Spending limits' },
] as const

type PolicyTab = (typeof POLICY_TABS)[number]

const getDefaultTab = (policies: Policy[]): PolicyTab['type'] =>
  (POLICY_TABS.find((tab) => policies.some((policy) => policy.type === tab.type)) ?? POLICY_TABS[0]).type

export type PoliciesListProps = {
  policies: Policy[]
  /** Opens the create-policy flow. The caller is responsible for requiring a connected wallet. */
  onAddPolicy?: () => void
  onSelectPolicy?: (policy: Policy) => void
}

/**
 * The Policies page once the space has policies: an Add policy button, a search field, a sort
 * control and a table per policy type. Search and sort run in the browser over the policies the
 * caller passes.
 */
const PoliciesList = ({ policies, onAddPolicy, onSelectPolicy }: PoliciesListProps) => {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<PolicySortOption | null>(null)
  const [activeTab, setActiveTab] = useState(() => getDefaultTab(policies))

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
  const rows = useMemo(
    () => sortPolicies(matches, sort ?? DEFAULT_POLICY_SORT, sortContext),
    [matches, sort, sortContext],
  )

  const renderTable = ({ type, label }: PolicyTab) => {
    const tabRows = rows.filter((policy) => policy.type === type)

    if (tabRows.length === 0) {
      return query ? <PoliciesNoSearchResults query={query} /> : <PoliciesTabEmpty label={label} />
    }

    return <PoliciesTable policies={tabRows} type={type} onSelect={onSelectPolicy} />
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PolicyTab['type'])}>
        <TabsList variant="underline" className="mb-2">
          {POLICY_TABS.map((tab) => (
            <TabsTrigger
              key={tab.type}
              value={tab.type}
              className="cursor-pointer"
              data-testid={`policies-tab-${tab.type}`}
            >
              {tab.label} ({rows.filter((policy) => policy.type === tab.type).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {POLICY_TABS.map((tab) => (
          <TabsContent key={tab.type} value={tab.type}>
            <TableCard>{renderTable(tab)}</TableCard>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default PoliciesList
