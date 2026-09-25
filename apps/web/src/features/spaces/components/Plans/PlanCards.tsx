import { useEffect, useState } from 'react'
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

/** Fixed marketing copy: the saving differs per plan, so the toggle advertises the ceiling rather than a derived figure. */
export const YEARLY_SAVINGS_LABEL = 'Save up to 13%'

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
  /** A viewer who cannot act on the plan (a Workspace member who is not an admin): the cards show no buttons. */
  readOnly?: boolean
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
        <Button size="lg" weight="semibold" accentIcon className="w-full" disabled={isBusy} onClick={onManage}>
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
        <Button
          size="lg"
          weight="semibold"
          accentIcon
          className="w-full"
          disabled={isBusy}
          onClick={() => onSubscribe?.(pick)}
        >
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
  // In the catalog the plan in force is the one white, raised card; a chooser marks its pick with the mint border.
  const isCurrentInCatalog = !selectable && Boolean(tier.isCurrent)
  const currentOption = tier.options.find((candidate) => candidate.priceId === tier.currentPriceId)
  const [option, setOption] = useState<PlanSeatOption | undefined>(currentOption ?? tier.options[0])
  // The subscription can land after the card mounted; the selector must then snap to the plan in force.
  useEffect(() => {
    if (currentOption) setOption(currentOption)
  }, [currentOption])
  const price = option?.price ?? null
  const hint = salesHint?.(tier)
  const features = option?.features?.length ? option.features : tier.features

  const changeOption = (next: PlanSeatOption) => {
    setOption(next)
    onOptionChange?.(next)
  }

  return (
    <Card
      variant={isCurrentInCatalog ? 'default' : 'muted-secondary'}
      elevated={isCurrentInCatalog}
      radius="lg-xl"
      className={cn('flex-1', selectable && 'cursor-pointer')}
      selected={selectable ? Boolean(selected) : undefined}
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
                <Typography variant={selectable ? 'paragraph-large-medium' : 'h4'}>{tier.name}</Typography>
                {tier.isCurrent && currentBadge && (
                  <Badge variant={currentBadge.variant} size="status" shape="status">
                    {currentBadge.label}
                  </Badge>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <Typography variant="h4" className={cn(selectable && 'line-through')}>
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

              <List className="gap-1">
                {features.map((feature) => (
                  <ListItem key={feature} size="sm" className="py-0">
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

          {!selectable && !actions.readOnly && option && <PlanCta pick={{ tier, option }} {...actions} />}
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
  const hasYearly = tiers.some((tier) => tier.billingCycle === 'year')
  // The current card stays put when the other cycle has no offer of that plan to replace it.
  const visible = tiers.filter((tier) => {
    if (tier.billingCycle === null || tier.billingCycle === cycle) return true
    return Boolean(tier.isCurrent) && !tiers.some((other) => other.name === tier.name && other.billingCycle === cycle)
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Tabs value={cycle} onValueChange={(value) => setCycle(value as Cycle)}>
          <TabsList aria-label="Billing cycle">
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="year">
              Yearly
              {hasYearly && (
                <Badge variant="brand" size="status" shape="status">
                  {YEARLY_SAVINGS_LABEL}
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

export const READ_ONLY_NOTE = 'Only admins can change the plan. Ask an admin to upgrade, switch or change seats.'

export default function PlanCards(props: { tiers: PlanTier[] } & PlanCardActions) {
  return (
    <Card radius="xl">
      <CardContent>
        <div className="flex flex-col gap-6">
          <PlanCatalog {...props} />
          {props.readOnly && (
            <Typography variant="paragraph-small" color="muted" align="center">
              {READ_ONLY_NOTE}
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
