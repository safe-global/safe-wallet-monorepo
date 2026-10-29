import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Input } from '@safe-global/views/components/ui/input'
import { Link } from '@safe-global/views/components/ui/link'
import { List, ListItem } from '@safe-global/views/components/ui/list'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@safe-global/views/components/ui/select'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { MixpanelEventParams, PlanCtaKind, type PlanLocation } from '@/services/analytics/mixpanel-events'
import { cn } from '@safe-global/views/utils/cn'
import { RECOMMENDED_PLAN } from '@safe-global/views/features/spaces/components/Plans/planCatalog'
import type {
  CurrentPlan,
  PlanCta as PlanCtaKindOf,
  PlanPick,
  PlanSeatOption,
  PlanTier,
} from '@safe-global/views/features/spaces/components/Plans/types'
import { FeatureCheck } from './FeatureCheck'
import { getCardSaving, getPlanCta, getPlanPrice, pickProps, pickSeatOption, plansClickParams } from './planTiers'

const CTA_KIND: Partial<Record<PlanCtaKindOf['kind'], PlanCtaKind>> = {
  billing: PlanCtaKind.ADD_PAYMENT_METHOD,
  change: PlanCtaKind.SWITCH_PLAN,
  subscribe: PlanCtaKind.CONTINUE_WITH_PLAN,
}

const SUPPORT_HIGHLIGHT_CLASSES = [
  'absolute -inset-x-[0.08em] bottom-[calc(2px-0.06em)] -z-10 h-1 origin-left bg-mint',
  'scale-x-0 transition-transform duration-[450ms] ease-soft motion-reduce:transition-none',
  'group-hover/plan:scale-x-100 group-hover/plan:delay-75 group-focus-within/plan:scale-x-100',
].join(' ')

const optionKey = (option: PlanSeatOption) => option.priceId ?? option.paymentLinkId ?? option.label

const Seats = ({
  options,
  value,
  onChange,
  label,
}: {
  options: PlanSeatOption[]
  value: PlanSeatOption
  onChange: (option: PlanSeatOption) => void
  label?: string
}) =>
  options.length > 1 ? (
    <Select
      value={optionKey(value)}
      onValueChange={(key) => {
        const next = options.find((option) => optionKey(option) === key)
        if (next) onChange(next)
      }}
    >
      <SelectTrigger className="w-full" aria-label={label}>
        {/* The closed trigger would otherwise print the raw value, the price id. */}
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
    <Input readOnly value={value.label} aria-label={label} />
  )

export type PlanCardActions = {
  onSubscribe?: (pick: PlanPick) => void
  onManage?: () => void
  isBusy?: boolean
  currentPlan?: CurrentPlan
  readOnly?: boolean
  location: PlanLocation
  onCta?: (pick: PlanPick, cta: PlanCtaKindOf) => void
}

const SalesCta = ({
  label,
  kind,
  location,
  onClick,
}: {
  label: string
  kind: 'sales' | 'account-team'
  location: PlanLocation
  onClick?: () => void
}) => {
  const trackLabel = kind === 'sales' ? SAFE_PRO_PLANS_LABELS.talk_to_sales : SAFE_PRO_PLANS_LABELS.account_team
  return (
    <Track
      {...SAFE_PRO_EVENTS.PLANS_CLICKED}
      label={trackLabel}
      mixpanelParams={plansClickParams(trackLabel, location)}
      as="div"
    >
      <Button
        variant="outline"
        size="lg"
        weight="semibold"
        className="w-full"
        render={<a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />}
        onClick={onClick}
      >
        {label}
        <ArrowUpRight data-icon="inline-end" />
      </Button>
    </Track>
  )
}

const PlanCta = ({
  pick,
  isPrimary,
  currentPlan,
  onSubscribe,
  onManage,
  isBusy,
  location,
  onCta,
}: { pick: PlanPick; isPrimary: boolean } & PlanCardActions) => {
  const cta = getPlanCta(pick, currentPlan)

  switch (cta.kind) {
    case 'sales':
      return <SalesCta label={cta.label} kind={cta.kind} location={location} onClick={() => onCta?.(pick, cta)} />
    case 'account-team':
      return <SalesCta label={cta.label} kind={cta.kind} location={location} />
    case 'current':
      return (
        <Button variant="outline" size="lg" weight="semibold" className="w-full" disabled>
          {cta.label}
        </Button>
      )
    case 'billing':
    case 'subscribe':
    case 'change':
      return (
        <Button
          variant={isPrimary ? 'default' : 'outline'}
          size="lg"
          weight="semibold"
          accentIcon={isPrimary}
          className="w-full"
          disabled={isBusy}
          onClick={() => {
            trackEvent(SAFE_PRO_EVENTS.PLAN_CTA_CLICKED, {
              ...pickProps(pick),
              [MixpanelEventParams.CTA]: CTA_KIND[cta.kind],
              [MixpanelEventParams.PLAN_IS_CURRENT]: Boolean(pick.tier.isCurrent),
              [MixpanelEventParams.LOCATION]: location,
            })
            onCta?.(pick, cta)
            if (cta.kind === 'billing') onManage?.()
            else onSubscribe?.(pick)
          }}
        >
          {cta.label}
          <ArrowRight data-icon="inline-end" />
        </Button>
      )
    default: {
      const _exhaustive: never = cta
      return _exhaustive
    }
  }
}

export const PlanCard = ({
  tier,
  seatsLabel,
  onSeatsChange,
  counterpartTier,
  onSwitchToYearly,
  ...actions
}: {
  tier: PlanTier
  seatsLabel?: string
  onSeatsChange?: (label: string) => void
  counterpartTier?: PlanTier
  onSwitchToYearly?: () => void
} & PlanCardActions) => {
  const { subtitle, supportLevel, supportDetail } = tier.copy ?? {}
  const isPrimary = tier.name === RECOMMENDED_PLAN
  const isCurrentPlan = Boolean(tier.isCurrent)
  const option = pickSeatOption(tier, actions.currentPlan, seatsLabel)
  const price = option ? getPlanPrice(tier, option) : undefined
  const isYearly = tier.billingCycle === 'year'
  const saving = getCardSaving(tier, option, counterpartTier)
  const features = option?.features?.length ? option.features : tier.features

  // Always render all five rows so the subgrid lines up across cards.
  return (
    <Card
      variant={isCurrentPlan ? 'default' : 'muted-secondary'}
      bordered={!isCurrentPlan}
      selected={isCurrentPlan || undefined}
      shadowOnHover={isCurrentPlan}
      highlightOnHover={!isCurrentPlan}
      size="offer"
      radius="lg-xl"
      className={cn(
        'group/plan min-w-0 @4xl:row-span-5 @4xl:grid @4xl:grid-rows-subgrid',
        // The current card goes grey while another card is hovered.
        isCurrentPlan && 'group-has-[[data-hover-plan]:hover]/plans:bg-muted-secondary',
      )}
      data-testid={tier.isCurrent ? 'current-plan-card' : 'plan-card'}
      data-hover-plan={!isCurrentPlan || undefined}
    >
      <CardContent className="flex min-w-0 flex-col @2xl:@max-4xl:grid @2xl:@max-4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @2xl:@max-4xl:grid-rows-[auto_1fr_auto_auto_auto] @2xl:@max-4xl:gap-x-10 @4xl:row-span-5 @4xl:grid @4xl:grid-cols-[minmax(0,1fr)] @4xl:grid-rows-subgrid">
        <div className="flex flex-col gap-1.5 @2xl:@max-4xl:col-start-1 @2xl:@max-4xl:row-start-1">
          <div className="flex items-center gap-2">
            <Typography variant="h4">{tier.name}</Typography>
            {isCurrentPlan && (
              <Badge variant="mint" size="status" shape="status" data-testid="plan-current-badge">
                Current
              </Badge>
            )}
          </div>
          {subtitle && (
            <Typography variant="paragraph-small" color="muted">
              {subtitle}
            </Typography>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-0.5 @2xl:@max-4xl:col-start-1 @2xl:@max-4xl:row-start-3">
          {price && (
            <div className="flex items-baseline gap-1">
              <Typography variant="h3">{price.headline}</Typography>
              <Typography variant="paragraph-small" color="muted">
                {price.suffix}
              </Typography>
            </div>
          )}
          {saving && isYearly && (
            <Typography variant="paragraph-small" className="flex items-center gap-1" data-testid="plan-yearly-saving">
              <Check aria-hidden className="size-3.5 shrink-0 text-accent-success" />
              Save {saving.amount} ({saving.percent}) vs monthly
            </Typography>
          )}
          {saving && !isYearly && onSwitchToYearly && (
            <Typography variant="paragraph-small">
              <Link
                render={<button type="button" />}
                variant="muted"
                data-testid="plan-yearly-saving"
                onClick={onSwitchToYearly}
              >
                Save {saving.amount} ({saving.percent}) with yearly
              </Link>
            </Typography>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2.5 @2xl:@max-4xl:col-start-1 @2xl:@max-4xl:row-start-4">
          {option && (
            <>
              <Seats
                options={tier.options}
                value={option}
                onChange={(next) => onSeatsChange?.(next.label)}
                label={`Safe accounts for ${tier.name}`}
              />
              {!actions.readOnly && (
                <div className="flex flex-wrap gap-2 *:min-w-max *:flex-1 *:basis-0" data-testid="plan-ctas">
                  <PlanCta pick={{ tier, option }} isPrimary={isPrimary} {...actions} />
                  {isPrimary && (
                    <SalesCta
                      label="Talk to sales"
                      kind="sales"
                      location={actions.location}
                      onClick={() => actions.onCta?.({ tier, option }, { kind: 'sales', label: 'Talk to sales' })}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-6 @2xl:@max-4xl:col-start-2 @2xl:@max-4xl:row-span-4 @2xl:@max-4xl:row-start-1 @2xl:@max-4xl:mt-0">
          <Separator className="@2xl:@max-4xl:hidden" />
          <div className="flex flex-col gap-3">
            {features.length > 0 && <Typography variant="paragraph-small-bold">What&apos;s included</Typography>}
            <List className="gap-3" data-testid="plan-features">
              {features.map((label) => (
                <ListItem key={label} size="sm" className="items-start py-0">
                  <FeatureCheck />
                  <Typography variant="paragraph-small">{label}</Typography>
                </ListItem>
              ))}
            </List>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5 @2xl:@max-4xl:col-span-2 @2xl:@max-4xl:col-start-1 @2xl:@max-4xl:row-start-5">
          {(supportLevel || supportDetail) && (
            <>
              <Separator />
              <div className="flex flex-col gap-1" data-testid="plan-support">
                {supportLevel && (
                  <Typography variant="paragraph-bold" data-testid="plan-support-level">
                    <span className="relative isolate">
                      {supportLevel}
                      <span aria-hidden className={SUPPORT_HIGHLIGHT_CLASSES} />
                    </span>{' '}
                    support
                  </Typography>
                )}
                {supportDetail && (
                  <Typography variant="paragraph-small" color="muted">
                    {supportDetail}
                  </Typography>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
