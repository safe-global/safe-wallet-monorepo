import { Check, Minus } from 'lucide-react'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import type { TrialFeature } from './planCatalog'
import type { TrialSize } from './types'

const formatPrice = (amount: number, currency: string): string =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)

const freeLabel = (trialPeriodDays: number | null): string =>
  trialPeriodDays === null ? 'Free' : `Free for ${trialPeriodDays} days`

export const TrialSizeTabs = ({
  sizes,
  value,
  onChange,
}: {
  sizes: TrialSize[]
  value: TrialSize
  onChange: (size: TrialSize) => void
}) => (
  <Tabs
    value={value.paymentLinkId}
    onValueChange={(id) => {
      const next = sizes.find((size) => size.paymentLinkId === id)
      if (next) onChange(next)
    }}
  >
    <TabsList className="w-full" aria-label="Safe accounts" data-testid="trial-size-tabs">
      {sizes.map((size) => (
        <TabsTrigger key={size.paymentLinkId} value={size.paymentLinkId} data-testid={`trial-size-${size.seats}`}>
          {size.seats} Safes
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
)

export const TrialFeatureList = ({ features, columns = 1 }: { features: TrialFeature[]; columns?: 1 | 2 }) => (
  <ul className={cn('grid gap-x-4', columns === 2 ? 'grid-cols-2 gap-y-2' : 'gap-y-3')} data-testid="trial-features">
    {features.map(({ label, included }) => (
      <li key={label} className="flex items-start gap-2">
        <span
          aria-hidden
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted"
          data-testid={included ? 'feature-included' : 'feature-excluded'}
        >
          {included ? <Check className="size-3" strokeWidth={2} /> : <Minus className="size-3 text-muted-foreground" />}
        </span>
        <Typography variant="paragraph-small" color={included ? 'default' : 'muted'}>
          {label}
        </Typography>
      </li>
    ))}
  </ul>
)

type TrialPriceProps = { size: TrialSize; trialPeriodDays: number | null }

const monthlyPriceOf = (size: TrialSize): string | null =>
  size.monthlyPrice === null ? null : formatPrice(size.monthlyPrice, size.currency)

/** One small line above a call to action: the struck-through monthly price and the free period. */
export const TrialPriceLine = ({ size, trialPeriodDays }: TrialPriceProps) => {
  const price = monthlyPriceOf(size)
  return (
    <Typography variant="paragraph-small" color="muted" align="center" data-testid="trial-price">
      {price && <span className="line-through">{price}/mo</span>}{' '}
      <span className="font-semibold text-badge-dot-success">{freeLabel(trialPeriodDays)}</span>
    </Typography>
  )
}

/** The large struck-through monthly price next to the free period, as the plan card shows it. */
export const TrialPrice = ({ size, trialPeriodDays }: TrialPriceProps) => {
  const price = monthlyPriceOf(size)
  return (
    <div className="flex flex-wrap items-baseline gap-x-2" data-testid="trial-price">
      {price && (
        <>
          <Typography variant="h3" color="muted" className="line-through decoration-2">
            {price}
          </Typography>
          <Typography variant="paragraph-small" color="muted" className="line-through">
            /mo
          </Typography>
        </>
      )}
      <Typography variant="paragraph-bold" color="success">
        {freeLabel(trialPeriodDays)}
      </Typography>
    </div>
  )
}

/** Vertical plan card whose title, copy and features follow the picked size. */
export const TrialPlanCard = ({
  sizes,
  value,
  onChange,
  trialPeriodDays,
  features,
}: {
  sizes: TrialSize[]
  value: TrialSize
  onChange: (size: TrialSize) => void
  trialPeriodDays: number | null
  features: TrialFeature[]
}) => (
  <Card selected size="offer" radius="lg-xl" className="w-full max-w-md" data-testid="trial-plan-card">
    <CardContent>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Typography variant="h4">{value.planName}</Typography>
          <Typography variant="paragraph-small" color="muted" className="min-h-[2lh]">
            {value.subtitle}
          </Typography>
        </div>
        <TrialPrice size={value} trialPeriodDays={trialPeriodDays} />
        <TrialSizeTabs sizes={sizes} value={value} onChange={onChange} />
        <Separator />
        <TrialFeatureList features={features} columns={2} />
      </div>
    </CardContent>
  </Card>
)
