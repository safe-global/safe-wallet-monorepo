import { useMemo, useRef, useState } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY, formatApy, formatCompactUsd, formatUsd } from '../copy'
import { EXISTING_POSITIONS, OPPORTUNITIES, TREASURY_TOTAL } from '../opportunities'
import {
  buildShelf,
  filterOpportunities,
  groupOpportunities,
  isLocked,
  NO_FILTERS,
  summariseTreasury,
  type ListFilters,
} from '../shelf'
import type { DefiV1Config, GroupBy, Opportunity, OpportunityCategory, RiskLevel } from '../types'
import { CompareDialog } from './CompareDialog'
import { DepositDialog, type DepositResult } from './DepositDialog'
import { OpportunityDrawer } from './OpportunityDrawer'
import { OpportunityToolbar } from './OpportunityToolbar'
import { PolicyPanel } from './PolicyPanel'
import { TreasurySection } from './TreasurySection'
import { TreasurySummary } from './TreasurySummary'
import { InvestmentsTable, OpportunitiesTable, type OpportunityGroup, type Position } from './TreasuryTables'

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

const matches = (item: Opportunity, search: string) =>
  !search || `${item.name} ${item.runBy} ${item.asset}`.toLowerCase().includes(search.toLowerCase())

const groupTitle = (groupBy: GroupBy, key: string): string | undefined => {
  if (groupBy === 'category') return DEFI_V1_COPY.category[key as OpportunityCategory].title
  if (groupBy === 'risk') return DEFI_V1_COPY.risk[key as RiskLevel]
  if (groupBy === 'asset') return key
  return undefined
}

export const DefiV1Page = ({ config }: { config: DefiV1Config }) => {
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [depositing, setDepositing] = useState<Opportunity | null>(null)
  const [positions, setPositions] = useState<Position[]>(initialPositions)
  const [investmentsOpen, setInvestmentsOpen] = useState(false)
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(true)
  const investmentsRef = useRef<HTMLElement>(null)
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [filters, setFilters] = useState<ListFilters>(NO_FILTERS)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const locked = (item: Opportunity) => isLocked(item, config.model, config.plan)
  const summary = summariseTreasury(TREASURY_TOTAL, positions)

  const visible = useMemo(
    () => filterOpportunities(RANKED, filters).filter((item) => matches(item, search)),
    [filters, search],
  )
  const groups = useMemo<OpportunityGroup[]>(
    () => groupOpportunities(visible, groupBy).map((group) => ({ ...group, title: groupTitle(groupBy, group.key) })),
    [visible, groupBy],
  )
  const topOpen = visible.find((item) => !locked(item))
  const investedIds = positions.map((position) => position.opportunity.id)
  const compareItems = RANKED.filter((item) => compareIds.includes(item.id))
  const toggleCompare = (id: string) =>
    setCompareIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const seeInvestments = () => {
    setInvestmentsOpen(true)
    investmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onDeposited = ({ opportunity, amount, pending }: DepositResult) =>
    setPositions((current) => [{ opportunity, principal: amount, earned: 0, pending }, ...current])

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
        <TreasurySummary summary={summary} onSeeInvestments={seeInvestments} />
      </div>

      <div className="flex flex-col gap-6">
        <TreasurySection
          id="investments"
          ref={investmentsRef}
          title={DEFI_V1_COPY.sections.investments}
          count={positions.length}
          badge={
            positions.length > 0 && (
              <Badge variant="mint" size="status" shape="status">
                {DEFI_V1_COPY.sections.investedBadge(formatCompactUsd(summary.invested))}
              </Badge>
            )
          }
          summary={DEFI_V1_COPY.sections.investmentsSummary(formatUsd(summary.earned), formatApy(summary.blendedApy))}
          open={investmentsOpen}
          onOpenChange={setInvestmentsOpen}
        >
          <InvestmentsTable positions={positions} />
        </TreasurySection>

        <TreasurySection
          id="opportunities"
          title={DEFI_V1_COPY.sections.opportunities}
          count={visible.length}
          open={opportunitiesOpen}
          onOpenChange={setOpportunitiesOpen}
        >
          <div className="flex flex-col gap-4">
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
              policy={<PolicyPanel plan={config.plan} />}
              onDeposit={topOpen ? () => setSelected(topOpen) : undefined}
            />
            <OpportunitiesTable
              groups={groups}
              isLocked={locked}
              onSelect={setSelected}
              onDeposit={setDepositing}
              selection={{ selected: compareIds, isFull: compareIds.length >= MAX_COMPARE, onToggle: toggleCompare }}
              investedIds={investedIds}
            />
          </div>
        </TreasurySection>
      </div>

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
          setDepositing(item)
        }}
      />

      <OpportunityDrawer
        opportunity={selected}
        list={visible}
        onNavigate={setSelected}
        locked={selected ? locked(selected) : false}
        plan={config.plan}
        signing={config.plan === 'pro' ? config.signing : 'threshold'}
        position={positions.find((position) => position.opportunity.id === selected?.id)}
        onClose={() => setSelected(null)}
        onDeposit={(item) => {
          setSelected(null)
          setDepositing(item)
        }}
      />

      <DepositDialog
        key={depositing?.id ?? 'none'}
        opportunity={depositing}
        signing={config.plan === 'pro' ? config.signing : 'threshold'}
        onClose={() => setDepositing(null)}
        onDeposited={onDeposited}
      />
    </div>
  )
}
