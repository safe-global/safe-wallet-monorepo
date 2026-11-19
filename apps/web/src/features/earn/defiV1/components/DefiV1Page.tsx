import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Orbit, Repeat2 } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY } from '../copy'
import { EXISTING_POSITIONS, IDLE_MIX, OPERATIONS, OPPORTUNITIES, TREASURY_TOTAL } from '../opportunities'
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
import { OpportunityToolbar } from './OpportunityToolbar'
import { SetUpInvestmentDialog } from './SetUpInvestmentDialog'
import { SetUpInvestmentDrawer } from './SetUpInvestmentDrawer'
import type { CreatedInvestment } from './InvestmentForm'
import { SetUpInvestmentFlow, SetUpInvestmentStepper } from './SetUpInvestmentStepper'
import { InvestButton } from './InvestButton'
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

export const initialPositions = (): Position[] =>
  EXISTING_POSITIONS.flatMap((existing) => {
    const opportunity = OPPORTUNITIES.find((item) => item.id === existing.opportunityId)
    return opportunity ? [{ opportunity, principal: existing.principal, earned: existing.earned, pending: false }] : []
  })

const MAX_COMPARE = 3
const { groups: SHELF_GROUPS, more: MORE } = buildShelf(OPPORTUNITIES)
const SHELF_IDS = SHELF_GROUPS.flatMap((group) => group.items.map((item) => item.id))
const RANKED = [...SHELF_GROUPS.flatMap((group) => group.items), ...MORE].sort(byExitTime)

const matches = (item: Opportunity, search: string) =>
  !search || `${item.name} ${item.runBy} ${item.asset}`.toLowerCase().includes(search.toLowerCase())

export const DefiV1Page = ({ config }: { config: DefiV1Config }) => {
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [positions, setPositions] = useState<Position[]>(initialPositions)
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [sort, setSort] = useState<Sort | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const [hubTab, setHubTab] = useState<HubTab>('swap')
  const [isMoving, setIsMoving] = useState(false)
  const [operations, setOperations] = useState<Operation[]>(OPERATIONS)
  const [isCreating, setIsCreating] = useState(false)
  const [setupFor, setSetupFor] = useState<Opportunity | null>(null)
  const router = useRouter()
  const locked = (item: Opportunity) => isLocked(item, config.plan)
  const goTo = (pathname: string) => router.push({ pathname, query: router.query })
  const summary = summariseTreasury(TREASURY_TOTAL, positions)

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
  const heldInOf = (item: Opportunity) => (config.plan === 'pro' ? heldIn(operations, item.id) : undefined)
  const SetUp = { dialog: SetUpInvestmentDialog, drawer: SetUpInvestmentDrawer, stepper: SetUpInvestmentStepper }[
    config.setup
  ]
  const setupOptions = RANKED.filter((item) => !locked(item))
  const createInvestment = ({ operation, opportunity, amount }: CreatedInvestment) => {
    if (operation) setOperations((current) => [...current, operation])
    setPositions((current) => [{ opportunity, principal: amount, earned: 0, pending: true }, ...current])
  }
  const openSetup = (item: Opportunity | null) => {
    if (config.setup === 'drawer') setSelected(null)
    setSetupFor(item)
    setIsCreating(true)
  }

  const compareItems = RANKED.filter((item) => compareIds.includes(item.id))
  const toggleCompare = (id: string) =>
    setCompareIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  const tableProps = {
    selection: { selected: compareIds, isFull: compareIds.length >= MAX_COMPARE, onToggle: toggleCompare },
    isLocked: locked,
    onSelect: setSelected,
    onInvest: config.plan === 'pro' ? openSetup : undefined,
    sort,
    onSort: (key: SortKey) => setSort((current) => nextSort(current, key)),
    holdingOf,
    heldInOf,
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
            <Button
              variant="outline"
              onClick={() => {
                setHubTab('swap')
                setIsMoving(true)
              }}
            >
              <Repeat2 />
              {DEFI_V1_COPY.swap}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setHubTab('bridge')
                setIsMoving(true)
              }}
            >
              <Orbit />
              {DEFI_V1_COPY.bridge}
            </Button>
          </div>
        </div>
        <TreasurySummary
          summary={summary}
          idleAssets={idleByAsset(summary.idle, IDLE_MIX)}
          earnedBy={earnedByInvestment(positions)}
        />
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
          invest={<InvestButton plan={config.plan} onInvest={() => openSetup(null)} />}
        />
        <OpportunitiesTable
          label={hasInvestments ? DEFI_V1_COPY.sections.investments : DEFI_V1_COPY.sections.opportunities}
          groups={groups}
          {...tableProps}
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

      <MoveFundsDialog
        open={isMoving}
        tab={hubTab}
        onTabChange={setHubTab}
        balances={idleByAsset(summary.idle, IDLE_MIX)}
        invest={(tabs) => (
          <SetUpInvestmentFlow
            tabs={tabs}
            opportunity={null}
            options={setupOptions}
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
          setSelected(item)
        }}
        onInvest={(item) => {
          setIsComparing(false)
          openSetup(item)
        }}
      />

      <SetUp
        key={setupFor?.id ?? 'any'}
        open={isCreating}
        opportunity={setupFor}
        options={setupOptions}
        onClose={() => setIsCreating(false)}
        onCreate={createInvestment}
        onView={(item) => {
          setIsCreating(false)
          setSelected(item)
        }}
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
