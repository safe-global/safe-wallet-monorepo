import { useState } from 'react'
import { ArrowUpRight, Check } from 'lucide-react'
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
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { cn } from '@/utils/cn'
import type { PlanSeatOption, PlanTier } from './types'

type Cycle = 'month' | 'year'

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

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
        <SelectValue />
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

export const PlanCard = ({
  tier,
  currentBadge,
  selected,
  onSelect,
  onOptionChange,
  onSubscribe,
  isSubscribing,
}: {
  tier: PlanTier
  currentBadge?: string
  selected?: boolean
  onSelect?: () => void
  onOptionChange?: (option: PlanSeatOption) => void
  /** Set when the Workspace has no plan: purchasable offers get a real CTA instead of "Coming soon". */
  onSubscribe?: (paymentLinkId: string) => void
  isSubscribing?: boolean
}) => {
  const selectable = onSelect !== undefined
  const [option, setOption] = useState<PlanSeatOption | undefined>(tier.options[0])
  const price = option?.price ?? null

  const changeOption = (next: PlanSeatOption) => {
    setOption(next)
    onOptionChange?.(next)
  }

  return (
    <Card
      variant="muted-secondary"
      radius="lg-xl"
      className={cn('flex-1', selectable && 'cursor-pointer')}
      selected={selectable ? Boolean(selected) : undefined}
      role={selectable ? 'radio' : undefined}
      aria-checked={selectable ? selected : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={selectable ? (e) => (e.key === 'Enter' || e.key === ' ') && onSelect() : undefined}
    >
      <CardContent className="flex flex-1 flex-col">
        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Typography variant={selectable ? 'paragraph-large-medium' : 'h3'}>{tier.name}</Typography>
                {tier.isCurrent && currentBadge && (
                  <Badge variant="brand" size="status" shape="status">
                    {currentBadge}
                  </Badge>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <Typography variant={selectable ? 'h4' : 'h2'} className={cn(selectable && 'line-through')}>
                  {price === null ? 'Custom' : formatPrice(price, tier.currency)}
                </Typography>
                <Typography color="muted">
                  {price === null ? 'Annual term' : tier.billingCycle === 'year' ? '/yr' : '/mo'}
                </Typography>
                {selectable && (
                  <Typography variant="paragraph-large-bold" color="success">
                    Free
                  </Typography>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {option && <Seats options={tier.options} value={option} onChange={changeOption} />}

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

          {!selectable &&
            (onSubscribe && option?.paymentLinkId ? (
              <Button
                size="lg"
                weight="semibold"
                className="w-full"
                disabled={isSubscribing}
                onClick={() => onSubscribe(option.paymentLinkId as string)}
              >
                Choose plan
              </Button>
            ) : (
              <Button variant="outline" size="lg" weight="semibold" className="w-full">
                Coming soon
              </Button>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function PlanCards({
  tiers,
  currentBadge,
  onSubscribe,
  isSubscribing,
}: {
  tiers: PlanTier[]
  currentBadge: string
  onSubscribe?: (paymentLinkId: string) => void
  isSubscribing?: boolean
}) {
  const [cycle, setCycle] = useState<Cycle>('month')
  const discount = yearlyDiscount(tiers)
  const visible = tiers.filter((tier) => tier.isCurrent || tier.billingCycle === null || tier.billingCycle === cycle)

  return (
    <Card radius="xl">
      <CardContent>
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
      </CardContent>

      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row">
          {visible.map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              currentBadge={currentBadge}
              onSubscribe={onSubscribe}
              isSubscribing={isSubscribing}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
