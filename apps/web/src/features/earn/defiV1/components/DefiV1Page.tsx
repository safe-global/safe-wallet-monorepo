import { useMemo, useState } from 'react'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY } from '../copy'
import { EXISTING_POSITIONS, OPPORTUNITIES, TREASURY_TOTAL } from '../opportunities'
import {
  buildShelf,
  categoryHighlights,
  filterOpportunities,
  isLocked,
  NUDGE_MAX_EXIT_HOURS,
  summariseTreasury,
  type ListFilters,
} from '../shelf'
import type { DefiV1Config, Opportunity } from '../types'
import { CategoryCards } from './CategoryCards'
import { DepositDialog, type DepositResult } from './DepositDialog'
import { OpportunityDrawer } from './OpportunityDrawer'
import { PolicyPanel } from './PolicyPanel'
import { TreasurySummary } from './TreasurySummary'
import {
  InvestmentsTable,
  MORE_GROUP,
  OpportunitiesTable,
  type OpportunityGroup,
  type Position,
} from './TreasuryTables'

const ALL = 'all'

type PageTab = 'opportunities' | 'investments'

const initialPositions = (): Position[] =>
  EXISTING_POSITIONS.flatMap((existing) => {
    const opportunity = OPPORTUNITIES.find((item) => item.id === existing.opportunityId)
    return opportunity ? [{ opportunity, principal: existing.principal, earned: existing.earned, pending: false }] : []
  })

const FilterTabs = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) => (
  <Tabs value={value} onValueChange={(next) => onChange(String(next))}>
    <TabsList aria-label={label}>
      {options.map((option) => (
        <TabsTrigger key={option.value} value={option.value}>
          {option.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
)

const matches = (item: Opportunity, search: string) =>
  !search || `${item.name} ${item.runBy} ${item.asset}`.toLowerCase().includes(search.toLowerCase())

const treasuryGroups = (search: string): OpportunityGroup[] => {
  const { groups, more } = buildShelf(OPPORTUNITIES)
  return [
    ...groups.map((group) => ({
      id: group.category,
      title: DEFI_V1_COPY.category[group.category].title,
      subtitle: DEFI_V1_COPY.category[group.category].subtitle,
      items: group.items.filter((item) => matches(item, search)),
    })),
    {
      id: MORE_GROUP,
      title: DEFI_V1_COPY.moreTitle,
      subtitle: DEFI_V1_COPY.moreLead,
      items: more.filter((item) => matches(item, search)),
    },
  ].filter((group) => group.items.length > 0)
}

export const DefiV1Page = ({ config }: { config: DefiV1Config }) => {
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [depositing, setDepositing] = useState<Opportunity | null>(null)
  const [positions, setPositions] = useState<Position[]>(initialPositions)
  const [tab, setTab] = useState<PageTab>('opportunities')
  const [search, setSearch] = useState('')
  const [asset, setAsset] = useState(ALL)
  const [chain, setChain] = useState(ALL)
  const [exit, setExit] = useState(ALL)
  const isDefi = config.framing === 'defi'
  const locked = (item: Opportunity) => isLocked(item, config.model, config.plan)
  const summary = summariseTreasury(TREASURY_TOTAL, positions)
  const highlights = useMemo(() => categoryHighlights(OPPORTUNITIES), [])

  const groups = useMemo<OpportunityGroup[]>(() => {
    if (!isDefi) return treasuryGroups(search)
    const filters: ListFilters = {
      asset: asset === ALL ? undefined : asset,
      chain: chain === ALL ? undefined : chain,
      maxExitHours: exit === ALL ? undefined : NUDGE_MAX_EXIT_HOURS,
    }
    return [
      {
        id: 'all',
        title: DEFI_V1_COPY.tabName.defi,
        items: filterOpportunities(OPPORTUNITIES, filters).filter((item) => matches(item, search)),
      },
    ]
  }, [isDefi, search, asset, chain, exit])

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
        <TreasurySummary
          summary={summary}
          footer={<PolicyPanel plan={config.plan} idle={summary.idle} />}
          onSeeInvestments={() => setTab('investments')}
        />
      </div>

      <Tabs value={tab} onValueChange={(next) => setTab(next as PageTab)} className="mb-4">
        <TabsList aria-label="Treasury sections">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="investments">Investments ({positions.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'investments' ? (
        <section aria-label="Investments">
          <InvestmentsTable positions={positions} />
        </section>
      ) : (
        <section aria-label="Opportunities" className="flex flex-col gap-4">
          {!isDefi && <CategoryCards highlights={highlights} onSelect={(highlight) => setSelected(highlight.top)} />}
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              aria-label="Search opportunities"
              placeholder="Search by name or asset"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch('')}
              className="max-w-72"
            />
            {isDefi && (
              <div className="flex flex-wrap items-center gap-2">
                <FilterTabs
                  label="Asset"
                  value={asset}
                  onChange={setAsset}
                  options={[
                    { value: ALL, label: 'All assets' },
                    { value: 'USDC', label: 'USDC' },
                    { value: 'ETH', label: 'ETH' },
                  ]}
                />
                <FilterTabs
                  label="Network"
                  value={chain}
                  onChange={setChain}
                  options={[
                    { value: ALL, label: 'All networks' },
                    { value: 'Ethereum', label: 'Ethereum' },
                    { value: 'Base', label: 'Base' },
                    { value: 'Arbitrum', label: 'Arbitrum' },
                  ]}
                />
                <FilterTabs
                  label="Exit time"
                  value={exit}
                  onChange={setExit}
                  options={[
                    { value: ALL, label: 'Any exit time' },
                    { value: 'day', label: 'Within a day' },
                  ]}
                />
              </div>
            )}
          </div>
          <OpportunitiesTable
            groups={groups}
            flat={isDefi}
            isLocked={locked}
            onSelect={setSelected}
            onDeposit={setDepositing}
          />
        </section>
      )}

      <OpportunityDrawer
        opportunity={selected}
        locked={selected ? locked(selected) : false}
        plan={config.plan}
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
