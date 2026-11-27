import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowRight, Orbit, Repeat2 } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { AppRoutes } from '@/config/routes'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY, formatCompactUsd } from '../copy'
import {
  EXISTING_POSITIONS,
  IDLE_MIX,
  OPERATIONS,
  OPPORTUNITIES,
  TREASURY_TOTAL,
  WORKSPACE_SAFES,
} from '../opportunities'
import {
  buildShelf,
  byExitTime,
  groupOpportunities,
  heldIn,
  holdingsFor,
  earnedByInvestment,
  idleByAsset,
  investedFirst,
  isLocked,
  operationsFor,
  sortOpportunities,
  summariseTreasury,
} from '../shelf'
import type { AssetType, DefiV1Config, GroupBy, Operation, Opportunity, Position, Sort, SortKey } from '../types'
import type { ActionResult } from './ActionPanel'
import { CompareDialog } from './CompareDialog'
import { MoveFundsDialog, type HubTab } from './MoveFundsDialog'
import { OpportunityDrawer } from './OpportunityDrawer'
import { OpportunityCards } from './OpportunityCards'
import { OpportunityToolbar, type OpportunityView } from './OpportunityToolbar'
import type { CreatedInvestment } from './InvestmentForm'
import { SetUpInvestmentFlow } from './SetUpInvestmentStepper'
import { TreasurySummary } from './TreasurySummary'
import { OpportunitiesTable, type OpportunityGroup } from './TreasuryTables'

const DEFAULT_DIRECTION: Record<SortKey, Sort['direction']> = {
  name: 'asc',
  apy: 'desc',
  type: 'asc',
  exit: 'asc',
  position: 'desc',
}

/** Each click on a header goes default direction, reversed, then back to the default order. */
const nextSort = (current: Sort | null, key: SortKey): Sort | null => {
  if (current?.key !== key) return { key, direction: DEFAULT_DIRECTION[key] }
  return current.direction === DEFAULT_DIRECTION[key]
    ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : null
}

const toPositions = (list: typeof EXISTING_POSITIONS, safe?: string): Position[] =>
  list.flatMap((existing) => {
    const opportunity = OPPORTUNITIES.find((item) => item.id === existing.opportunityId)
    return opportunity
      ? [{ opportunity, principal: existing.principal, earned: existing.earned, pending: false, safe }]
      : []
  })

const initialPositions = ({ scope }: DefiV1Config): Position[] => {
  if (scope === 'workspace') return WORKSPACE_SAFES.flatMap((safe) => toPositions(safe.positions, safe.name))
  return toPositions(EXISTING_POSITIONS)
}

const ALL = 'all'
const SAFE_NAMES = WORKSPACE_SAFES.map((safe) => safe.name)

const MAX_COMPARE = 3
const { groups: SHELF_GROUPS, more: MORE } = buildShelf(OPPORTUNITIES)
const SHELF_IDS = SHELF_GROUPS.flatMap((group) => group.items.map((item) => item.id))
const RANKED = [...SHELF_GROUPS.flatMap((group) => group.items), ...MORE].sort(byExitTime)

const matches = (item: Opportunity, search: string) =>
  !search || `${item.name} ${item.runBy} ${item.asset}`.toLowerCase().includes(search.toLowerCase())

export const DefiV1Page = ({ config }: { config: DefiV1Config }) => {
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [allPositions, setPositions] = useState<Position[]>(() => initialPositions(config))
  const [safeFilter, setSafeFilter] = useState(ALL)
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [view, setView] = useState<OpportunityView>('cards')
  const [sort, setSort] = useState<Sort | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const [hubTab, setHubTab] = useState<HubTab>('deposit')
  const [isMoving, setIsMoving] = useState(false)
  const [depositFor, setDepositFor] = useState<Opportunity | null>(null)
  const [operations, setOperations] = useState<Operation[]>(OPERATIONS)
  const router = useRouter()
  const isPro = config.plan === 'pro'
  const isWorkspace = config.scope === 'workspace'
  const locked = (item: Opportunity) => isLocked(item, config.plan)
  const goTo = (pathname: string) => router.push({ pathname, query: router.query })
  const positions = useMemo(
    () => (safeFilter === ALL ? allPositions : allPositions.filter((position) => position.safe === safeFilter)),
    [allPositions, safeFilter],
  )
  const total = isWorkspace
    ? WORKSPACE_SAFES.filter((safe) => safeFilter === ALL || safe.name === safeFilter).reduce(
        (sum, safe) => sum + safe.total,
        0,
      )
    : TREASURY_TOTAL
  const summary = summariseTreasury(total, positions)
  const safesOf = (item: Opportunity) => [
    ...new Set(positions.filter((position) => position.opportunity.id === item.id).flatMap((p) => p.safe ?? [])),
  ]

  const investedIds = useMemo(() => [...new Set(positions.map((position) => position.opportunity.id))], [positions])
  const holdingOf = (item: Opportunity) => holdingsFor(positions, item.id)
  const visible = useMemo(() => {
    const found = RANKED.filter((item) => matches(item, search))
    if (!sort) return investedFirst(found, investedIds)
    return sortOpportunities(found, sort, (item) => {
      const holding = holdingsFor(positions, item.id)
      return holding ? holding.invested + holding.pending : 0
    })
  }, [search, sort, investedIds, positions])
  const isBrowsing = showAll || search !== '' || groupBy !== 'none' || sort !== null
  const listed = useMemo(
    () =>
      isBrowsing ? visible : visible.filter((item) => SHELF_IDS.includes(item.id) || investedIds.includes(item.id)),
    [isBrowsing, visible, investedIds],
  )
  const hiddenCount = visible.length - listed.length
  const hasInvestments = groupBy === 'none' && listed.some((item) => investedIds.includes(item.id))
  const groups = useMemo<OpportunityGroup[]>(() => {
    if (groupBy !== 'none')
      return groupOpportunities(listed, groupBy).map((group) => ({
        ...group,
        title: groupBy === 'type' ? DEFI_V1_COPY.assetType[group.key as AssetType].label : group.key,
      }))
    const others = listed.filter((item) => !investedIds.includes(item.id))
    if (!hasInvestments) return [{ key: 'opportunities', items: others }]
    return [
      { key: 'invested', items: listed.filter((item) => investedIds.includes(item.id)) },
      { key: 'opportunities', title: DEFI_V1_COPY.sections.opportunities, showColumns: true, items: others },
    ]
  }, [listed, groupBy, investedIds, hasInvestments])
  const heldInOf = (item: Opportunity) => (isPro ? heldIn(operations, item.id) : undefined)
  const setupOptions = RANKED.filter((item) => !locked(item))
  const createInvestment = ({ operation, opportunity, amount, safe }: CreatedInvestment) => {
    if (operation) setOperations((current) => [...current, operation])
    setPositions((current) => [{ opportunity, principal: amount, earned: 0, pending: true, safe }, ...current])
  }
  const openHub = (tab: HubTab, item: Opportunity | null = null) => {
    setSelected(null)
    setDepositFor(item)
    setHubTab(tab)
    setIsMoving(true)
  }
  const deposit = (item: Opportunity | null) => (item && locked(item) ? setSelected(item) : openHub('deposit', item))

  const compareItems = RANKED.filter((item) => compareIds.includes(item.id))
  const toggleCompare = (id: string) =>
    setCompareIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  const tableProps = {
    selection: { selected: compareIds, isFull: compareIds.length >= MAX_COMPARE, onToggle: toggleCompare },
    isLocked: locked,
    onSelect: setSelected,
    onDeposit: deposit,
    safesOf: isWorkspace && safeFilter === ALL ? safesOf : undefined,
    sort,
    onSort: (key: SortKey) => setSort((current) => nextSort(current, key)),
    holdingOf,
    heldInOf,
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
          <div className="flex flex-col gap-1">
            <Typography as="h1" variant="h3">
              {isWorkspace ? DEFI_V1_COPY.workspace.title : DEFI_V1_COPY.tabName[config.framing]}
            </Typography>
            <Typography variant="paragraph-small" color="muted">
              {isWorkspace ? DEFI_V1_COPY.workspace.lead : DEFI_V1_COPY.tabLead}
            </Typography>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openHub('swap')}>
              <Repeat2 />
              {DEFI_V1_COPY.swap}
            </Button>
            <Button variant="outline" onClick={() => openHub('bridge')}>
              <Orbit />
              {DEFI_V1_COPY.bridge}
            </Button>
          </div>
        </div>
        {isWorkspace && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" data-testid="safe-filter" />}>
                {safeFilter === ALL ? DEFI_V1_COPY.workspace.allSafes : safeFilter}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup value={safeFilter} onValueChange={(value) => setSafeFilter(String(value))}>
                  <DropdownMenuRadioItem value={ALL}>{DEFI_V1_COPY.workspace.allSafes}</DropdownMenuRadioItem>
                  {SAFE_NAMES.map((name) => (
                    <DropdownMenuRadioItem key={name} value={name}>
                      {name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {safeFilter === ALL && <span>{DEFI_V1_COPY.workspace.across(SAFE_NAMES.length)}</span>}
          </div>
        )}
        {isPro && !isWorkspace && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" data-testid="workspace-link">
            <span>{DEFI_V1_COPY.workspace.partOf}</span>
            <Button variant="ghost" size="sm" onClick={() => goTo(AppRoutes.spaces.index)}>
              {DEFI_V1_COPY.workspace.seeAll}
              <ArrowRight />
            </Button>
          </div>
        )}
        {isPro ? (
          <TreasurySummary
            summary={summary}
            idleAssets={idleByAsset(summary.idle, IDLE_MIX)}
            earnedBy={earnedByInvestment(positions)}
          />
        ) : (
          <Typography variant="paragraph-small" color="muted" className="tabular-nums" data-testid="summary-line">
            {DEFI_V1_COPY.summary.line(
              formatCompactUsd(summary.invested),
              formatCompactUsd(summary.earned),
              formatCompactUsd(summary.idle),
            )}
          </Typography>
        )}
      </div>

      <section aria-label={DEFI_V1_COPY.sections.opportunities} className="flex flex-col gap-4">
        <OpportunityToolbar
          search={search}
          onSearch={setSearch}
          groupBy={groupBy}
          onGroupBy={setGroupBy}
          compareCount={compareIds.length}
          onCompare={() => setIsComparing(true)}
          hasInvestments={investedIds.length > 0}
          view={view}
          onView={setView}
          invest={
            <Button size="action" onClick={() => deposit(null)} data-testid="deposit-button">
              {DEFI_V1_COPY.action.deposit}
            </Button>
          }
        />
        {view === 'cards' ? (
          <OpportunityCards
            label={hasInvestments ? DEFI_V1_COPY.sections.investments : DEFI_V1_COPY.sections.opportunities}
            groups={groups}
            {...tableProps}
          />
        ) : (
          <OpportunitiesTable
            label={hasInvestments ? DEFI_V1_COPY.sections.investments : DEFI_V1_COPY.sections.opportunities}
            groups={groups}
            {...tableProps}
          />
        )}
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

      <MoveFundsDialog
        open={isMoving}
        tab={hubTab}
        onTabChange={setHubTab}
        balances={idleByAsset(summary.idle, IDLE_MIX)}
        deposit={(tabs) => (
          <SetUpInvestmentFlow
            key={depositFor?.id ?? 'any'}
            tabs={tabs}
            opportunity={depositFor}
            options={setupOptions}
            nested={isPro}
            safes={isWorkspace ? (safeFilter === ALL ? SAFE_NAMES : [safeFilter]) : undefined}
            onClose={() => setIsMoving(false)}
            onCreate={createInvestment}
            onView={(item) => {
              setIsMoving(false)
              setSelected(item)
            }}
          />
        )}
        onClose={() => setIsMoving(false)}
      />

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
          deposit(item)
        }}
      />

      <OpportunityDrawer
        opportunity={selected}
        list={listed}
        onNavigate={setSelected}
        locked={selected ? locked(selected) : false}
        operations={isPro && selected ? operationsFor(operations, selected.id) : []}
        canCreate={isPro}
        onDeposit={() => openHub('deposit', selected)}
        holding={selected ? holdingOf(selected) : undefined}
        onClose={() => setSelected(null)}
        onWithdrawn={onWithdrawn}
      />
    </div>
  )
}
