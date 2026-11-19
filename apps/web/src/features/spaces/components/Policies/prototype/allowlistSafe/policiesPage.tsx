import { useMemo, useState, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Button } from '@safe-global/views/components/ui/button'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { Typography } from '@safe-global/views/components/ui/typography'
import { PoliciesNoSearchResults } from '@safe-global/views/features/spaces/components/Policies/PoliciesTable/components/PoliciesTableStates'
import {
  DEFAULT_POLICY_SORT,
  sortPolicies,
  type PolicySortContext,
} from '@safe-global/views/features/spaces/components/Policies/utils/policySort'
import {
  isPendingPolicy,
  isProposerPolicy,
  isSpendingLimitPolicy,
  type Policy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import useChains from '@/hooks/useChains'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import ProposerDetails from '../../ProposerDetails'
import SpendingLimitDetails from '../../SpendingLimitDetails'
import usePolicySearch from '../../hooks/usePolicySearch'
import { useSpacePolicies } from '../../hooks/useSpacePolicies'
import { ActiveFilterChips, FiltersPopover, type FilterGroup } from '../m2OverviewPage'
import {
  ACCOUNT_NAMES,
  isProtectedSafe,
  PROTECTED_SAFE,
  ProtectedPoliciesTable,
  ProtectedSafeDrawer,
  type PolicyTableRow,
} from './protectedPolicy'

const TYPE_OPTIONS = [
  { value: 'spending-limit', label: 'Spending limit' },
  { value: 'proposer', label: 'Proposer' },
  { value: 'protected', label: 'Protected Safe account' },
]

type Filters = { accounts: string[]; networks: string[]; types: string[] }
const NO_FILTERS: Filters = { accounts: [], networks: [], types: [] }

/** The production Policies page and table, with the Policies prototypes' toolbar: search, Filters, New on the right. */
export const PoliciesPage = (): ReactElement => {
  const { policies, isLoading, isError, refetch } = useSpacePolicies()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [openPolicy, setOpenPolicy] = useState<Policy | null>(null)
  const [isProtectedOpen, setIsProtectedOpen] = useState(false)

  const resolveSafeName = useSafeNameResolver()
  const { configs } = useChains()
  const chainNames = useMemo(() => new Map(configs.map((chain) => [chain.chainId, chain.chainName])), [configs])
  const sortContext = useMemo<PolicySortContext>(
    () => ({
      getSafeName: (safe) => resolveSafeName(safe.address, safe.chainId),
      getChainName: (chainId) => chainNames.get(chainId) ?? chainId,
    }),
    [chainNames, resolveSafeName],
  )

  const { policies: matches, matchedSpenderNames } = usePolicySearch(policies, query)
  const rows = useMemo(() => {
    const filtered = matches.filter(
      (policy) =>
        (filters.accounts.length === 0 || filters.accounts.includes(policy.safe.address)) &&
        (filters.networks.length === 0 || filters.networks.includes(policy.safe.chainId)) &&
        (filters.types.length === 0 || filters.types.includes(policy.type)),
    )
    const { account } = PROTECTED_SAFE
    const search = query.trim().toLowerCase()
    const showsProtected =
      (!search || `protected safe account ${account.name} ${account.address}`.toLowerCase().includes(search)) &&
      (filters.accounts.length === 0 || filters.accounts.includes(account.address)) &&
      (filters.networks.length === 0 || filters.networks.includes(account.chainId)) &&
      (filters.types.length === 0 || filters.types.includes('protected'))
    const sorted: PolicyTableRow[] = sortPolicies(filtered, DEFAULT_POLICY_SORT, sortContext)
    return showsProtected ? [PROTECTED_SAFE, ...sorted] : sorted
  }, [matches, filters, sortContext, query])

  const allSafes = [...policies.map(({ safe }) => safe), PROTECTED_SAFE.account]
  const accountOptions = [...new Map(allSafes.map((safe) => [safe.address, safe])).values()].map((safe) => ({
    value: safe.address,
    label: resolveSafeName(safe.address, safe.chainId) || ACCOUNT_NAMES.get(safe.address.toLowerCase()) || safe.address,
  }))
  const networkOptions = [...new Set(allSafes.map(({ chainId }) => chainId))].map((chainId) => ({
    value: chainId,
    label: chainNames.get(chainId) ?? chainId,
  }))
  const filterGroups: FilterGroup[] = [
    {
      label: 'Safe account',
      options: accountOptions,
      selected: filters.accounts,
      onChange: (accounts) => setFilters({ ...filters, accounts }),
    },
    {
      label: 'Network',
      options: networkOptions,
      selected: filters.networks,
      onChange: (networks) => setFilters({ ...filters, networks }),
    },
    {
      label: 'Type',
      options: TYPE_OPTIONS,
      selected: filters.types,
      onChange: (types) => setFilters({ ...filters, types }),
    },
  ]
  const clearFilters = () => setFilters(NO_FILTERS)

  const listedPolicy = openPolicy ? policies.find(({ id }) => id === openPolicy.id) : undefined
  const openedPolicy = listedPolicy ?? (openPolicy && isPendingPolicy(openPolicy) ? openPolicy : null)

  return (
    // <main>, as the app's page route wraps it: the layout pads that element.
    <main data-testid="policies">
      <div className="mb-6 flex flex-col gap-6" data-testid="policies-heading">
        <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
          Policies
        </Typography>
        <Typography variant="paragraph-medium">
          Policies are rules that help you manage your Safe accounts. Set them up once and they will run onchain,
          automatically.{' '}
          <ExternalLink noIcon href={HelpCenterArticle.POLICIES}>
            Learn more
          </ExternalLink>
        </Typography>
      </div>

      {isLoading ? (
        <SpaceLoading subject="policies" testId="policies-loading" />
      ) : isError ? (
        <SpaceLoadError onReload={refetch} testId="policies-error" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              variant="surface"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
              placeholder="Search"
              aria-label="Search policies"
              autoComplete="off"
              className="flex-1"
            />
            <FiltersPopover groups={filterGroups} onClearAll={clearFilters} />
            <Button className="shrink-0" data-testid="m2-new-policy-button">
              <Plus className="size-4 text-green-500" aria-hidden />
              New
            </Button>
          </div>

          <ActiveFilterChips groups={filterGroups} onClearAll={clearFilters} />

          {/* A 4px bottom border in place of the card padding, so the bottom gap matches the sides (as in C). */}
          <TableCard className="pb-0 [&_tbody_tr:last-child_td]:border-b-4">
            {rows.length === 0 ? (
              <PoliciesNoSearchResults query={query} />
            ) : (
              <ProtectedPoliciesTable
                rows={rows}
                matchedSpenderNames={matchedSpenderNames}
                onSelect={(row) => (isProtectedSafe(row) ? setIsProtectedOpen(true) : setOpenPolicy(row))}
              />
            )}
          </TableCard>
        </div>
      )}

      {openedPolicy && isProposerPolicy(openedPolicy) && openedPolicy.data.proposers[0] && (
        <ProposerDetails
          policy={openedPolicy}
          proposer={openedPolicy.data.proposers[0]}
          onClose={() => setOpenPolicy(null)}
        />
      )}
      {isProtectedOpen && <ProtectedSafeDrawer row={PROTECTED_SAFE} onClose={() => setIsProtectedOpen(false)} />}
      {openedPolicy && isSpendingLimitPolicy(openedPolicy) && (
        <SpendingLimitDetails policy={openedPolicy} isUnlisted={!listedPolicy} onClose={() => setOpenPolicy(null)} />
      )}
    </main>
  )
}
