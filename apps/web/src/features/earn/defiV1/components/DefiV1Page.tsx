import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Orbit, Repeat2 } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY } from '../copy'
import { EXISTING_POSITIONS, OPERATIONS, OPPORTUNITIES, TREASURY_TOTAL } from '../opportunities'
import {
  activeFilterCount,
  buildShelf,
  byExitTime,
  filterOpportunities,
  groupOpportunities,
  investedFirst,
  holdingsFor,
  isLocked,
  NO_FILTERS,
  heldIn,
  operationsFor,
  summariseTreasury,
  type ListFilters,
} from '../shelf'
import type { DefiV1Config, GroupBy, LiquidityBucket, Operation, Opportunity, Position } from '../types'
import type { ActionResult } from './ActionPanel'
import { CompareDialog } from './CompareDialog'
import { OpportunityDrawer } from './OpportunityDrawer'
import { OpportunityToolbar } from './OpportunityToolbar'
import { SetUpInvestmentDialog } from './SetUpInvestmentDialog'
import { SetUpInvestmentDrawer } from './SetUpInvestmentDrawer'
import { OperationsButton } from './OperationsButton'
import { TreasurySummary } from './TreasurySummary'
import { OpportunitiesTable, type OpportunityGroup } from './TreasuryTables'

const MAX_COMPARE = 3

const initialPositions = (): Position[] =>
  EXISTING_POSITIONS.flatMap((existing) => {
    const opportunity = OPPORTUNITIES.find((item) => item.id === existing.opportunityId)
    return opportunity ? [{ opportunity, principal: existing.principal, earned: existing.earned, pending: false }] : []
  })

const { groups: SHELF_GROUPS, more: MORE } = buildShelf(OPPORTUNITIES)
const SHELF_IDS = SHELF_GROUPS.flatMap((group) => group.items.map((item) => item.id))
const RANKED = [...SHELF_GROUPS.flatMap((group) => group.items), ...MORE].sort(byExitTime)
const ASSETS = [...new Set(OPPORTUNITIES.map((item) => item.asset))]
const CHAINS = [...new Set(OPPORTUNITIES.flatMap((item) => item.chains))]

const matches = (item: Opportunity, search: string) =>
  !search || `${item.name} ${item.runBy} ${item.asset}`.toLowerCase().includes(search.toLowerCase())

const groupTitle = (groupBy: GroupBy, key: string): string | undefined => {
  if (groupBy === 'investments')
    return key === 'invested' ? DEFI_V1_COPY.sections.investments : DEFI_V1_COPY.sections.opportunities
  if (groupBy === 'liquidity') return DEFI_V1_COPY.liquidity[key as LiquidityBucket].title
  if (groupBy === 'asset') return key
  return undefined
}

export const DefiV1Page = ({ config }: { config: DefiV1Config }) => {
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [positions, setPositions] = useState<Position[]>(initialPositions)
  const tableRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [filters, setFilters] = useState<ListFilters>(NO_FILTERS)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [operations, setOperations] = useState<Operation[]>(OPERATIONS)
  const [isCreating, setIsCreating] = useState(false)
  const [setupFor, setSetupFor] = useState<Opportunity | null>(null)
  const router = useRouter()
  const locked = (item: Opportunity) => isLocked(item, config.plan)
  const goTo = (pathname: string) => router.push({ pathname, query: router.query })
  const summary = summariseTreasury(TREASURY_TOTAL, positions)

  const investedIds = useMemo(() => [...new Set(positions.map((position) => position.opportunity.id))], [positions])
  const visible = useMemo(
    () =>
      investedFirst(filterOpportunities(RANKED, filters, investedIds), investedIds).filter((item) =>
        matches(item, search),
      ),
    [filters, search, investedIds],
  )
  const isBrowsing = showAll || search !== '' || groupBy !== 'none' || activeFilterCount(filters) > 0
  const listed = useMemo(
    () =>
      isBrowsing ? visible : visible.filter((item) => SHELF_IDS.includes(item.id) || investedIds.includes(item.id)),
    [isBrowsing, visible, investedIds],
  )
  const hiddenCount = visible.length - listed.length
  const groups = useMemo<OpportunityGroup[]>(
    () =>
      groupOpportunities(listed, groupBy, investedIds).map((group) => ({
        ...group,
        title: groupTitle(groupBy, group.key),
      })),
    [listed, groupBy, investedIds],
  )
  const topOpen = listed.find((item) => !locked(item))
  const holdingOf = (item: Opportunity) => holdingsFor(positions, item.id)
  const heldInOf = (item: Opportunity) => (config.plan === 'pro' ? heldIn(operations, item.id) : undefined)
  const SetUp = config.setup === 'drawer' ? SetUpInvestmentDrawer : SetUpInvestmentDialog
  const openSetup = (item: Opportunity | null) => {
    if (config.setup === 'drawer') setSelected(null)
    setSetupFor(item)
    setIsCreating(true)
  }
  const compareItems = RANKED.filter((item) => compareIds.includes(item.id))
  const toggleCompare = (id: string) =>
    setCompareIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const showGrouped = (next: GroupBy, nextFilters: ListFilters = NO_FILTERS) => {
    setFilters(nextFilters)
    setSearch('')
    setGroupBy(next)
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onDeposited = ({ opportunity, amount, pending, operationId, created }: ActionResult) => {
    setPositions((current) => [{ opportunity, principal: amount, earned: 0, pending }, ...current])
    if (created) setOperations((current) => [...current, created])
    if (operationId && !pending)
      setOperations((current) =>
        current.map((item) => (item.id === operationId ? { ...item, invested: item.invested + amount } : item)),
      )
  }

  const onWithdrawn = ({ opportunity, amount, pending }: ActionResult) => {
    if (pending) return
    setPositions((current) =>
      current.map((position) =>
        position.opportunity.id === opportunity.id && !position.pending
          ? { ...position, principal: Math.max(position.principal - amount, 0) }
          : position,
      ),
    )
  }

  return (
    <div className="@container min-w-0 px-6 pb-8 pt-5" data-testid="defi-v1-page">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Typography as="h1" variant="h3">
            {DEFI_V1_COPY.tabName[config.framing]}
          </Typography>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => goTo(AppRoutes.swap)}>
              <Repeat2 />
              {DEFI_V1_COPY.swap}
            </Button>
            <Button variant="outline" onClick={() => goTo(AppRoutes.bridge)}>
              <Orbit />
              {DEFI_V1_COPY.bridge}
            </Button>
          </div>
        </div>
        <TreasurySummary
          summary={summary}
          investmentCount={investedIds.length}
          onExploreIdle={() => showGrouped('none', { ...NO_FILTERS, sameDay: true, openOnly: true })}
          onSeeInvestments={() => showGrouped('investments')}
          onGroupByLiquidity={() => showGrouped('liquidity')}
        />
      </div>

      <section
        ref={tableRef}
        aria-label={DEFI_V1_COPY.sections.opportunities}
        className="flex scroll-mt-6 flex-col gap-4"
      >
        <OpportunityToolbar
          search={search}
          onSearch={setSearch}
          groupBy={groupBy}
          onGroupBy={setGroupBy}
          filters={filters}
          onFilters={setFilters}
          assets={ASSETS}
          chains={CHAINS}
          compareCount={compareIds.length}
          onCompare={() => setIsComparing(true)}
          operations={<OperationsButton operations={operations} plan={config.plan} onNew={() => openSetup(null)} />}
          onDeposit={topOpen ? () => setSelected(topOpen) : undefined}
        />
        <OpportunitiesTable
          groups={groups}
          isLocked={locked}
          onSelect={setSelected}
          selection={{ selected: compareIds, isFull: compareIds.length >= MAX_COMPARE, onToggle: toggleCompare }}
          holdingOf={holdingOf}
          heldInOf={heldInOf}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          {hiddenCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
              {DEFI_V1_COPY.showAll(visible.length)}
            </Button>
          ) : (
            <span />
          )}
          <Button variant="ghost-muted" size="sm" onClick={() => goTo(AppRoutes.apps.index)}>
            {DEFI_V1_COPY.moreInApps}
          </Button>
        </div>
      </section>

      <CompareDialog
        items={compareItems}
        investedIds={investedIds}
        open={isComparing && compareItems.length > 1}
        isLocked={locked}
        onClose={() => setIsComparing(false)}
        onSelect={(item) => {
          setIsComparing(false)
          setSelected(item)
        }}
        onDeposit={(item) => {
          setIsComparing(false)
          setSelected(item)
        }}
      />

      <SetUp
        key={setupFor?.id ?? 'any'}
        open={isCreating}
        opportunity={setupFor}
        options={RANKED.filter((item) => !locked(item))}
        onClose={() => setIsCreating(false)}
        onCreate={(operation) => setOperations((current) => [...current, operation])}
      />

      <OpportunityDrawer
        opportunity={selected}
        list={listed}
        onNavigate={setSelected}
        locked={selected ? locked(selected) : false}
        operations={config.plan === 'pro' && selected ? operationsFor(operations, selected.id) : []}
        canCreate={config.plan === 'pro'}
        onCustomise={() => openSetup(selected)}
        holding={selected ? holdingOf(selected) : undefined}
        onClose={() => setSelected(null)}
        onDeposited={onDeposited}
        onWithdrawn={onWithdrawn}
      />
    </div>
  )
}
