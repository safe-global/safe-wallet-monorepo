import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { List, ListItem, ListItemText } from '@/components/ui/list'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { SAFE_PRO_ANNOUNCEMENT_URL, SUPPORT_CHAT_URL } from '@/config/constants'
import { cn } from '@/utils/cn'
import { formatPlanPrice, getPlanCta, priceSuffix } from './planTiers'
import type { CurrentPlan, PlanPick, PlanSeatOption, PlanTier } from './types'

type Cycle = 'month' | 'year'

export type CurrentBadge = { label: string; variant: 'brand' | 'warning' }

export const yearlyDiscount = (tiers: PlanTier[]): number | null => {
  for (const tier of tiers) {
    if (tier.billingCycle !== 'year') continue
    for (const { price, originalPrice } of tier.options) {
      if (price !== null && originalPrice) return Math.round((1 - price / originalPrice) * 100)
    }
  }
  return null
}

const optionKey = (option: PlanSeatOption) => option.paymentLinkId ?? option.label

const Seats = ({
  options,
  value,
  onChange,
}: {
  options: PlanSeatOption[]
  value: PlanSeatOption
  onChange: (option: PlanSeatOption) => void
}) =>
  options.length > 1 ? (
    <Select
      value={optionKey(value)}
      onValueChange={(key) => {
        const next = options.find((option) => optionKey(option) === key)
        if (next) onChange(next)
      }}
    >
      <SelectTrigger className="w-full">
        {/* The closed trigger would otherwise print the raw value, the payment link id. */}
        <SelectValue>{value.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={optionKey(option)} value={optionKey(option)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Input readOnly value={value.label} />
  )

export type PlanCardActions = {
  /** Move to, or buy, the picked offer. */
  onSubscribe?: (pick: PlanPick) => void
  /** Manage the current plan: the Stripe portal for billing details, invoices or cancellation. */
  onManage?: () => void
  isBusy?: boolean
  currentPlan?: CurrentPlan
  currentBadge?: CurrentBadge
  /** Without a live plan, the tier that gets the primary button; the others read as a switch. */
  recommendedPlan?: string
  /** A question shown under the seats ("Need more than 20?") followed by a link to sales. */
  salesHint?: (tier: PlanTier) => string | undefined
}

const PlanCta = ({
  pick,
  currentPlan,
  recommendedPlan,
  onSubscribe,
  onManage,
  isBusy,
}: { pick: PlanPick } & PlanCardActions) => {
  const cta = getPlanCta(pick, currentPlan, recommendedPlan)

  switch (cta.kind) {
    case 'sales':
      return (
        <Button
          variant="outline"
          size="lg"
          weight="semibold"
          className="w-full"
          render={<a href={SUPPORT_CHAT_URL} target="_blank" rel="noopener noreferrer" />}
        >
          {cta.label}
        </Button>
      )
    case 'billing':
      return (
        <Button size="lg" weight="semibold" className="w-full" disabled={isBusy} onClick={onManage}>
          {cta.label}
          <ArrowRight data-icon="inline-end" />
        </Button>
      )
    case 'manage':
      return (
        <Button variant="outline" size="lg" weight="semibold" className="w-full" disabled={isBusy} onClick={onManage}>
          {cta.label}
        </Button>
      )
    case 'subscribe':
      return (
        <Button size="lg" weight="semibold" className="w-full" disabled={isBusy} onClick={() => onSubscribe?.(pick)}>
          {cta.label}
          <ArrowRight data-icon="inline-end" />
        </Button>
      )
    case 'change':
      return (
        <Button
          variant="outline"
          size="lg"
          weight="semibold"
          className="w-full"
          disabled={isBusy}
          onClick={() => onSubscribe?.(pick)}
        >
          {cta.label}
        </Button>
      )
  }
}

export const PlanCard = ({
  tier,
  selected,
  onSelect,
  onOptionChange,
  currentBadge,
  salesHint,
  ...actions
}: {
  tier: PlanTier
  selected?: boolean
  onSelect?: () => void
  onOptionChange?: (option: PlanSeatOption) => void
} & PlanCardActions) => {
  const selectable = onSelect !== undefined
  const [option, setOption] = useState<PlanSeatOption | undefined>(tier.options[0])
  const price = option?.price ?? null
  const hint = salesHint?.(tier)

  const changeOption = (next: PlanSeatOption) => {
    setOption(next)
    onOptionChange?.(next)
  }

  return (
    <Card
      variant="muted-secondary"
      radius="lg-xl"
      className={cn('flex-1', selectable && 'cursor-pointer')}
      selected={selectable ? Boolean(selected) : tier.isCurrent}
      role={selectable ? 'radio' : undefined}
      aria-checked={selectable ? selected : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={selectable ? (e) => (e.key === 'Enter' || e.key === ' ') && onSelect() : undefined}
      data-testid={tier.isCurrent ? 'current-plan-card' : undefined}
    >
      <CardContent className="flex flex-1 flex-col">
        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Typography variant={selectable ? 'paragraph-large-medium' : 'h3'}>{tier.name}</Typography>
                {tier.isCurrent && currentBadge && (
                  <Badge variant={currentBadge.variant} size="status" shape="status">
                    {currentBadge.label}
                  </Badge>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <Typography variant={selectable ? 'h4' : 'h2'} className={cn(selectable && 'line-through')}>
                  {price === null ? 'Custom' : formatPlanPrice(price, tier.currency)}
                </Typography>
                <Typography color="muted">{price === null ? 'Annual term' : priceSuffix(tier.billingCycle)}</Typography>
                {selectable && (
                  <Typography variant="paragraph-large-bold" color="success">
                    Free
                  </Typography>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {option && (
                <div className="flex flex-col gap-1.5">
                  <Seats options={tier.options} value={option} onChange={changeOption} />
                  {hint && (
                    <Typography variant="paragraph-mini" color="muted">
                      {hint}{' '}
                      <Link href={SUPPORT_CHAT_URL} target="_blank" rel="noopener noreferrer" variant="muted">
                        Talk to sales <ArrowRight className="inline size-3" />
                      </Link>
                    </Typography>
                  )}
                </div>
              )}

              <List>
                {tier.features.map((feature) => (
                  <ListItem key={feature} size="sm">
                    <Avatar size="xs">
                      <AvatarFallback>
                        <Check className="size-4" strokeWidth={1.5} />
                      </AvatarFallback>
                    </Avatar>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </div>
          </div>

          {!selectable && option && <PlanCta pick={{ tier, option }} {...actions} />}
        </div>
      </CardContent>
    </Card>
  )
}

/** Billing-cycle toggle plus one card per visible tier; the Plans page wraps it in a card, dialogs use it bare. */
export function PlanCatalog({
  tiers,
  ...actions
}: {
  tiers: PlanTier[]
} & PlanCardActions) {
  const [cycle, setCycle] = useState<Cycle>('month')
  const discount = yearlyDiscount(tiers)
  const visible = tiers.filter((tier) => tier.isCurrent || tier.billingCycle === null || tier.billingCycle === cycle)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Tabs value={cycle} onValueChange={(value) => setCycle(value as Cycle)}>
          <TabsList aria-label="Billing cycle">
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="year">
              Yearly
              {discount !== null && (
                <Badge variant="brand" size="status" shape="status">
                  -{discount}%
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Link href={SAFE_PRO_ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" variant="muted">
          Compare all features <ArrowUpRight />
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {visible.map((tier) => (
          <PlanCard key={tier.id} tier={tier} {...actions} />
        ))}
      </div>
    </div>
  )
}

export default function PlanCards(props: { tiers: PlanTier[] } & PlanCardActions) {
  return (
    <Card radius="xl">
      <CardContent>
        <PlanCatalog {...props} />
      </CardContent>
    </Card>
  )
}
