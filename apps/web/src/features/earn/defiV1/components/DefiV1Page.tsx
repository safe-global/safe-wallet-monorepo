import { useMemo, useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@safe-global/views/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY } from '../copy'
import { EXISTING_POSITION, OPPORTUNITIES } from '../opportunities'
import { buildShelf, filterOpportunities, isLocked, NUDGE_MAX_EXIT_HOURS, type ListFilters } from '../shelf'
import type { DefiV1Config, Opportunity } from '../types'
import { DepositDialog, type DepositResult } from './DepositDialog'
import { FactSheet } from './FactSheet'
import { OpportunityRow } from './OpportunityRow'
import { PolicyPanel } from './PolicyPanel'
import { PositionCard, type Position } from './PositionCard'

const ALL = 'all'

const initialPositions = (): Position[] => {
  const opportunity = OPPORTUNITIES.find((item) => item.id === EXISTING_POSITION.opportunityId)
  return opportunity
    ? [{ opportunity, principal: EXISTING_POSITION.principal, earned: EXISTING_POSITION.earned, pending: false }]
    : []
}

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
  <div className="flex flex-col gap-1.5">
    <Typography variant="paragraph-mini-medium" color="muted">
      {label}
    </Typography>
    <Tabs value={value} onValueChange={(next) => onChange(String(next))}>
      <TabsList aria-label={label}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  </div>
)

const DefiList = ({ config, onSelect }: { config: DefiV1Config; onSelect: (item: Opportunity) => void }) => {
  const [asset, setAsset] = useState(ALL)
  const [chain, setChain] = useState(ALL)
  const [exit, setExit] = useState(ALL)
  const filters: ListFilters = {
    asset: asset === ALL ? undefined : asset,
    chain: chain === ALL ? undefined : chain,
    maxExitHours: exit === ALL ? undefined : NUDGE_MAX_EXIT_HOURS,
  }
  const items = filterOpportunities(OPPORTUNITIES, filters)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <FilterTabs
          label="Asset"
          value={asset}
          onChange={setAsset}
          options={[
            { value: ALL, label: 'All' },
            { value: 'USDC', label: 'USDC' },
            { value: 'ETH', label: 'ETH' },
          ]}
        />
        <FilterTabs
          label="Network"
          value={chain}
          onChange={setChain}
          options={[
            { value: ALL, label: 'All' },
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
            { value: ALL, label: 'Any' },
            { value: 'day', label: 'Within a day' },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <OpportunityRow
            key={item.id}
            opportunity={item}
            locked={isLocked(item, config.model, config.plan)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

const TreasuryShelf = ({ config, onSelect }: { config: DefiV1Config; onSelect: (item: Opportunity) => void }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const { groups, more } = useMemo(() => buildShelf(OPPORTUNITIES), [])
  const select = (item: Opportunity) => {
    setIsMoreOpen(false)
    onSelect(item)
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.category} className="flex flex-col gap-3" data-testid={`shelf-${group.category}`}>
          <div className="flex flex-col gap-0.5">
            <Typography variant="h4">{DEFI_V1_COPY.category[group.category].title}</Typography>
            <Typography variant="paragraph-small" color="muted">
              {DEFI_V1_COPY.category[group.category].subtitle}
            </Typography>
          </div>
          <div className="flex flex-col gap-2">
            {group.items.map((item) => (
              <OpportunityRow
                key={item.id}
                opportunity={item}
                locked={isLocked(item, config.model, config.plan)}
                onSelect={select}
              />
            ))}
          </div>
        </section>
      ))}

      <div>
        <Button variant="outline" onClick={() => setIsMoreOpen(true)}>
          {DEFI_V1_COPY.more(more.length)}
        </Button>
      </div>

      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent side="right" size="md">
          <SheetHeader>
            <SheetTitle>{DEFI_V1_COPY.moreTitle}</SheetTitle>
            <SheetDescription>{DEFI_V1_COPY.moreLead}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-4">
            {more.map((item) => (
              <OpportunityRow
                key={item.id}
                opportunity={item}
                locked={isLocked(item, config.model, config.plan)}
                onSelect={select}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export const DefiV1Page = ({ config }: { config: DefiV1Config }) => {
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [depositing, setDepositing] = useState<Opportunity | null>(null)
  const [positions, setPositions] = useState<Position[]>(initialPositions)

  const onDeposited = ({ opportunity, amount, pending }: DepositResult) =>
    setPositions((current) => [{ opportunity, principal: amount, earned: 0, pending }, ...current])

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 p-4 sm:p-6" data-testid="defi-v1-page">
      <header className="flex flex-col gap-2">
        <Typography variant="h2">{DEFI_V1_COPY.pageTitle[config.framing]}</Typography>
        <Typography color="muted">{DEFI_V1_COPY.pageLead[config.framing]}</Typography>
        {config.model === 'B' && config.plan === 'free' && (
          <Typography variant="paragraph-small" color="muted">
            {DEFI_V1_COPY.plan.modelB} · {DEFI_V1_COPY.plan.feePlaceholder}
          </Typography>
        )}
      </header>

      {positions.length > 0 && (
        <section className="flex flex-col gap-3" data-testid="defi-positions">
          <Typography variant="h4">{DEFI_V1_COPY.positions.title}</Typography>
          {positions.map((position, index) => (
            <PositionCard key={`${position.opportunity.id}-${index}`} position={position} />
          ))}
        </section>
      )}

      <PolicyPanel plan={config.plan} />

      {config.framing === 'treasury' ? (
        <TreasuryShelf config={config} onSelect={setSelected} />
      ) : (
        <DefiList config={config} onSelect={setSelected} />
      )}

      <FactSheet
        opportunity={selected}
        locked={selected ? isLocked(selected, config.model, config.plan) : false}
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
