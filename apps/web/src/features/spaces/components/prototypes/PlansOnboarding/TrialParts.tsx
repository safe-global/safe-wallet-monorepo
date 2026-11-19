import { Check, Minus } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { formatPrice, TRIAL_DAYS, TRIAL_SIZES, type TrialFeature, type TrialSize } from './plans'

export const SizeTabs = ({ value, onChange }: { value: TrialSize; onChange: (size: TrialSize) => void }) => (
  <Tabs
    value={String(value.seats)}
    onValueChange={(key) => {
      const next = TRIAL_SIZES.find((size) => String(size.seats) === key)
      if (next) onChange(next)
    }}
  >
    <TabsList className="w-full" aria-label="Safe accounts" data-testid="trial-size-tabs">
      {TRIAL_SIZES.map((size) => (
        <TabsTrigger key={size.seats} value={String(size.seats)} data-testid={`trial-size-${size.seats}`}>
          {size.seats} Safes
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
)

export const FeatureList = ({ features, columns = 1 }: { features: TrialFeature[]; columns?: 1 | 2 }) => (
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

/** The struck-through monthly price next to the free period. */
export const TrialPrice = ({ size, compact = false }: { size: TrialSize; compact?: boolean }) =>
  compact ? (
    <Typography variant="paragraph-small" color="muted" align="center" data-testid="trial-price">
      <span className="line-through">{formatPrice(size.monthlyPrice)}/mo</span>{' '}
      <span className="font-semibold text-badge-dot-success">Free for {TRIAL_DAYS} days</span>
    </Typography>
  ) : (
    <div className="flex flex-wrap items-baseline gap-x-2" data-testid="trial-price">
      <Typography variant="h3" color="muted" className="line-through decoration-2">
        {formatPrice(size.monthlyPrice)}
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="line-through">
        /mo
      </Typography>
      <Typography variant="paragraph-bold" color="success">
        Free for {TRIAL_DAYS} days
      </Typography>
    </div>
  )
