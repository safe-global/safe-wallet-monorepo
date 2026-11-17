import { useMemo, useState, type CSSProperties } from 'react'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Link } from '@safe-global/views/components/ui/link'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import { highlightSafePro } from '@safe-global/views/components/common/ProHighlight'
import type { PlanSeatOption, PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { SAFE_PRO_PRICING_URL } from '@/config/constants'
// eslint-disable-next-line no-restricted-imports -- prototype: reuses the Plans price formatting
import { formatPlanPrice, priceSuffix } from '@/features/spaces/components/Plans/planTiers'

type Size = { tier: PlanTier; option: PlanSeatOption & { seats: number } }

const TRIAL_DAYS = 30

/** Every monthly seat size across the tiers, smallest first. */
export const _sizesOf = (tiers: PlanTier[]): Size[] =>
  tiers
    .filter((tier) => tier.billingCycle === 'month')
    .flatMap((tier) =>
      tier.options.flatMap((option) =>
        typeof option.seats === 'number' ? [{ tier, option: { ...option, seats: option.seats } }] : [],
      ),
    )
    .sort((a, b) => a.option.seats - b.option.seats)

/** The smallest size that holds all the user's Safes, else the largest. */
export const _fittingSize = (sizes: Size[], safeCount: number): Size | undefined =>
  sizes.find((size) => size.option.seats >= safeCount) ?? sizes.at(-1)

export const TryProModal = ({
  tiers,
  safeCount,
  reason,
  onClose,
  onStartTrial,
}: {
  /** Monthly plan tiers, as the Plans page builds them. */
  tiers: PlanTier[]
  safeCount: number
  /** One line on why the user is seeing this, from the prompt that opened it. */
  reason?: string
  onClose: () => void
  onStartTrial?: (size: Size) => void
}) => {
  const sizes = useMemo(() => _sizesOf(tiers), [tiers])
  const [pickedSeats, setPickedSeats] = useState(() => _fittingSize(sizes, safeCount)?.option.seats)
  const size = sizes.find((candidate) => candidate.option.seats === pickedSeats) ?? sizes[0]

  if (!size) return null

  const { tier, option } = size
  const features = [`${option.seats} Safe accounts`, ...tier.features]
  const price = option.price === null ? 'Custom' : formatPlanPrice(option.price, tier.currency)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm-md" surface="card" padding="sm" showCloseButton={false} data-testid="try-pro-modal">
        <div className="flex flex-col gap-6 pt-5">
          <div className="flex flex-col gap-1">
            <Typography variant="h3" as={DialogTitle}>
              {highlightSafePro(`Try Safe Pro ${tier.name}`)}
            </Typography>
            {reason && <Typography color="muted">{reason}</Typography>}
          </div>

          <div className="flex flex-col gap-2">
            <Typography variant="paragraph-small-medium">Safe accounts</Typography>
            <Tabs value={String(size.option.seats)} onValueChange={(value) => setPickedSeats(Number(value))}>
              <TabsList size="lg">
                {sizes.map((candidate) => (
                  <TabsTrigger
                    key={candidate.option.seats}
                    value={String(candidate.option.seats)}
                    data-testid={`try-pro-size-${candidate.option.seats}`}
                  >
                    {candidate.option.seats}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Card variant="muted-secondary" radius="lg-xl">
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant="paragraph-large-medium">{tier.name}</Typography>
                <div className="flex items-baseline gap-1">
                  <Typography variant="h4" className="line-through">
                    {price}
                  </Typography>
                  <Typography color="muted">{priceSuffix(tier.billingCycle)}</Typography>
                  <Typography variant="paragraph-large-bold" color="success">
                    {TRIAL_DAYS} days free
                  </Typography>
                </div>
              </div>
              <ul
                className="grid gap-x-6 gap-y-2 sm:grid-flow-col sm:grid-rows-[repeat(var(--rows),auto)]"
                style={{ '--rows': Math.ceil(features.length / 2) } as CSSProperties}
              >
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                    <Typography variant="paragraph-small">{feature}</Typography>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-2">
            <Typography variant="paragraph-small" align="center">
              No payment method required. We&apos;ll remind you 7 days before your trial ends.
            </Typography>
            <Link href={SAFE_PRO_PRICING_URL} target="_blank" rel="noopener noreferrer" variant="muted">
              Compare all plans <ArrowUpRight />
            </Link>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
              Not now
            </Button>
            <Button size="lg" accentIcon className="flex-1" onClick={() => onStartTrial?.(size)}>
              Start free trial
              <ArrowRight />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
