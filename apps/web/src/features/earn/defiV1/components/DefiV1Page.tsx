import { useMemo, useRef, useState } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY } from '../copy'
import { EXISTING_POSITIONS, OPPORTUNITIES, TREASURY_TOTAL } from '../opportunities'
import {
  buildShelf,
  filterOpportunities,
  holdingsFor,
  isLocked,
  NO_FILTERS,
  splitByInvestment,
  summariseTreasury,
  type ListFilters,
} from '../shelf'
import type { DefiV1Config, Opportunity, Position } from '../types'
import type { ActionResult } from './ActionPanel'
import { CompareDialog } from './CompareDialog'
import { OpportunityDrawer } from './OpportunityDrawer'
import { OpportunityToolbar } from './OpportunityToolbar'
import { PolicyPanel } from './PolicyPanel'
import { TreasurySummary } from './TreasurySummary'
import { OpportunitiesTable, type OpportunityGroup } from './TreasuryTables'

const MAX_COMPARE = 3

const initialPositions = (): Position[] =>
  EXISTING_POSITIONS.flatMap((existing) => {
    const opportunity = OPPORTUNITIES.find((item) => item.id === existing.opportunityId)
    return opportunity ? [{ opportunity, principal: existing.principal, earned: existing.earned, pending: false }] : []
  })

const RANKED = (() => {
  const { groups, more } = buildShelf(OPPORTUNITIES)
  return [...groups.flatMap((group) => group.items), ...more]
})()
const ASSETS = [...new Set(OPPORTUNITIES.map((item) => item.asset))]
const CHAINS = [...new Set(OPPORTUNITIES.flatMap((item) => item.chains))]

const SECTION_TITLE = {
  invested: DEFI_V1_COPY.sections.investments,
  opportunities: DEFI_V1_COPY.sections.opportunities,
}

export const DefiV1Page = ({ config }: { config: DefiV1Config }) => {
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [positions, setPositions] = useState<Position[]>(initialPositions)
  const tableRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState<ListFilters>(NO_FILTERS)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const locked = (item: Opportunity) => isLocked(item, config.model, config.plan)
  const summary = summariseTreasury(TREASURY_TOTAL, positions)

  const investedIds = useMemo(() => [...new Set(positions.map((position) => position.opportunity.id))], [positions])
  const visible = useMemo(() => filterOpportunities(RANKED, filters, investedIds), [filters, investedIds])
  const groups = useMemo<OpportunityGroup[]>(() => {
    const sections = splitByInvestment(visible, investedIds)
    return sections.map((group) => ({ ...group, title: sections.length > 1 ? SECTION_TITLE[group.key] : undefined }))
  }, [visible, investedIds])
  const topOpen = visible.find((item) => !locked(item))
  const holdingOf = (item: Opportunity) => holdingsFor(positions, item.id)
  const compareItems = RANKED.filter((item) => compareIds.includes(item.id))
  const toggleCompare = (id: string) =>
    setCompareIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const showFiltered = (nextFilters: ListFilters) => {
    setFilters(nextFilters)
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onDeposited = ({ opportunity, amount, pending }: ActionResult) =>
    setPositions((current) => [{ opportunity, principal: amount, earned: 0, pending }, ...current])

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
        <div className="flex flex-col gap-1">
          <Typography as="h1" variant="h3">
            {DEFI_V1_COPY.tabName[config.framing]}
          </Typography>
          {config.model === 'B' && config.plan === 'free' && (
            <Typography variant="paragraph-mini" color="muted">
              {DEFI_V1_COPY.plan.modelB} · {DEFI_V1_COPY.plan.feePlaceholder}
            </Typography>
          )}
        </div>
        <TreasurySummary
          summary={summary}
          onExploreIdle={() => showFiltered({ ...NO_FILTERS, sameDay: true, openOnly: true })}
        />
      </div>

      <section
        ref={tableRef}
        aria-label={DEFI_V1_COPY.sections.opportunities}
        className="flex scroll-mt-6 flex-col gap-4"
      >
        <OpportunityToolbar
          filters={filters}
          onFilters={setFilters}
          assets={ASSETS}
          chains={CHAINS}
          compareCount={compareIds.length}
          onCompare={() => setIsComparing(true)}
          policy={<PolicyPanel plan={config.plan} />}
          onDeposit={topOpen ? () => setSelected(topOpen) : undefined}
        />
        <OpportunitiesTable
          groups={groups}
          isLocked={locked}
          onSelect={setSelected}
          selection={{ selected: compareIds, isFull: compareIds.length >= MAX_COMPARE, onToggle: toggleCompare }}
          holdingOf={holdingOf}
        />
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

      <OpportunityDrawer
        opportunity={selected}
        list={visible}
        onNavigate={setSelected}
        locked={selected ? locked(selected) : false}
        plan={config.plan}
        signing={config.plan === 'pro' ? config.signing : 'threshold'}
        holding={selected ? holdingOf(selected) : undefined}
        onClose={() => setSelected(null)}
        onDeposited={onDeposited}
        onWithdrawn={onWithdrawn}
      />
    </div>
  )
}
