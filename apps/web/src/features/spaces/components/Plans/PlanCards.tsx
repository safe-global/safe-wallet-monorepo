import { useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Input } from '@safe-global/views/components/ui/input'
import { Link } from '@safe-global/views/components/ui/link'
import { List, ListItem } from '@safe-global/views/components/ui/list'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@safe-global/views/components/ui/select'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import { SAFE_PRO_SERVICE_DESCRIPTIONS_URL, SAFE_PRO_TERMS_URL } from '@/config/constants'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { MixpanelEventParams, PlanCtaKind, type PlanLocation } from '@/services/analytics/mixpanel-events'
import { cn } from '@safe-global/views/utils/cn'
import { PLAN_CONTENT, RECOMMENDED_PLAN } from '@safe-global/views/features/spaces/components/Plans/planCatalog'
import type {
  CurrentPlan,
  PlanCta as PlanCtaKindOf,
  PlanPick,
  PlanSeatOption,
  PlanTier,
} from '@safe-global/views/features/spaces/components/Plans/types'
import { COMPARE_FEATURES_ID } from './CompareFeaturesCard'
import { FeatureCheck } from './FeatureCheck'
import {
  getCardCta,
  getCardSaving,
  getCatalogTiers,
  getPlanPrice,
  getVisibleTiers,
  pickProps,
  trackPlansClick,
} from './planTiers'

type Cycle = 'month' | 'year'

const CTA_KIND: Partial<Record<PlanCtaKindOf['kind'], PlanCtaKind>> = {
  billing: PlanCtaKind.ADD_PAYMENT_METHOD,
  change: PlanCtaKind.SWITCH_PLAN,
  subscribe: PlanCtaKind.CONTINUE_WITH_PLAN,
}

/** Mint line behind the support level that draws in while the card is hovered or focused. */
const SUPPORT_HIGHLIGHT_CLASSES = [
  'absolute -inset-x-[0.08em] bottom-[calc(2px-0.06em)] -z-10 h-1 origin-left bg-mint',
  'scale-x-0 transition-transform duration-[450ms] ease-soft motion-reduce:transition-none',
  'group-hover/plan:scale-x-100 group-hover/plan:delay-75 group-focus-within/plan:scale-x-100',
].join(' ')

/** The current card goes grey while another card is hovered; like every card, it only gets a shadow on hover. */
const CURRENT_PLAN_CLASSES =
  'shadow-none transition-[background-color,box-shadow] duration-200 hover:shadow-lg focus-within:shadow-lg motion-reduce:transition-none group-has-[[data-hover-plan]:hover]/plans:bg-muted-secondary'

const optionKey = (option: PlanSeatOption) => option.priceId ?? option.paymentLinkId ?? option.label

export const Seats = ({
  options,
  value,
  onChange,
  label,
}: {
  options: PlanSeatOption[]
  value: PlanSeatOption
  onChange: (option: PlanSeatOption) => void
  /** Accessible name for the control, e.g. "Safe accounts for Business". */
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
  /** Move to, or buy, the picked offer. */
  onSubscribe?: (pick: PlanPick) => void
  /** Manage the current plan: the Stripe portal for billing details, invoices or cancellation. */
  onManage?: () => void
  isBusy?: boolean
  currentPlan?: CurrentPlan
  /** A viewer who cannot act on the plan (a Workspace member who is not an admin): the cards show no buttons. */
  readOnly?: boolean
  /** Where the catalog is shown, for analytics. */
  location: PlanLocation
  /** Any plan button was clicked, before its action runs. */
  onCta?: (pick: PlanPick, cta: PlanCtaKindOf) => void
}

/** Outline link to sales, tracked by which card sent the user there. */
const SalesCta = ({
  label,
  kind,
  onClick,
}: {
  label: string
  kind: 'sales' | 'account-team'
  onClick?: () => void
}) => (
  <Button
    variant="outline"
    size="lg"
    weight="semibold"
    className="w-full"
    render={<a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />}
    onClick={() => {
      trackPlansClick(kind === 'sales' ? SAFE_PRO_PLANS_LABELS.talk_to_sales : SAFE_PRO_PLANS_LABELS.account_team)
      onClick?.()
    }}
  >
    {label}
    <ArrowUpRight data-icon="inline-end" />
  </Button>
)

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
  const cta = getCardCta(pick, currentPlan)

  switch (cta.kind) {
    case 'sales':
      return <SalesCta label={cta.label} kind={cta.kind} onClick={() => onCta?.(pick, cta)} />
    case 'account-team':
      return <SalesCta label={cta.label} kind={cta.kind} />
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
  /** Safe count picked on this plan, on either billing cycle. */
  seatsLabel?: string
  onSeatsChange?: (label: string) => void
  /** The same plan on the other billing cycle, to compare monthly and yearly prices. */
  counterpartTier?: PlanTier
  onSwitchToYearly?: () => void
} & PlanCardActions) => {
  const content = PLAN_CONTENT[tier.name]
  const isPrimary = tier.name === RECOMMENDED_PLAN
  // Follows the plan, not the billing cycle, so the highlight stays when switching monthly/yearly.
  const isCurrentPlan = tier.isCurrent || actions.currentPlan?.name === tier.name
  const option =
    tier.options.find((candidate) => candidate.label === seatsLabel) ??
    tier.options.find((candidate) => candidate.priceId === tier.currentPriceId) ??
    tier.options.find((candidate) => isCurrentPlan && candidate.label === actions.currentPlan?.seatsLabel) ??
    tier.options[0]
  const price = option ? getPlanPrice(tier, option) : undefined
  const isYearly = tier.billingCycle === 'year'
  const saving = getCardSaving(tier, option, counterpartTier)
  const features = content?.features ?? tier.features

  // Always render all five rows so the subgrid lines up across cards.
  return (
    <Card
      variant={isCurrentPlan ? 'default' : 'muted-secondary'}
      bordered={!isCurrentPlan}
      selected={isCurrentPlan || undefined}
      highlightOnHover={!isCurrentPlan}
      size="offer"
      radius="lg-xl"
      className={cn(
        'group/plan min-w-0 @4xl:row-span-5 @4xl:grid @4xl:grid-rows-subgrid',
        isCurrentPlan && CURRENT_PLAN_CLASSES,
      )}
      data-testid={tier.isCurrent ? 'current-plan-card' : 'plan-card'}
      data-hover-plan={!isCurrentPlan || undefined}
      data-primary={isPrimary || undefined}
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
          {content && (
            <Typography variant="paragraph-small" color="muted">
              {content.description}
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
                  {isPrimary && <SalesCta label="Talk to sales" kind="sales" />}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-6 @2xl:@max-4xl:col-start-2 @2xl:@max-4xl:row-span-4 @2xl:@max-4xl:row-start-1 @2xl:@max-4xl:mt-0">
          <Separator className="@2xl:@max-4xl:hidden" />
          <div className="flex flex-col gap-3">
            {content && <Typography variant="paragraph-small-bold">What&apos;s included</Typography>}
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
          {content && (
            <>
              <Separator />
              <div className="flex flex-col gap-1" data-testid="plan-support">
                <Typography variant="paragraph-bold" data-testid="plan-support-level">
                  <span className="relative isolate">
                    {content.support.level}
                    <span aria-hidden className={SUPPORT_HIGHLIGHT_CLASSES} />
                  </span>{' '}
                  support
                </Typography>
                <Typography variant="paragraph-small" color="muted">
                  {content.support.detail}
                </Typography>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const READ_ONLY_NOTE = 'Only admins can change the plan. Ask an admin to upgrade, switch or change seats.'

/** Billing-cycle toggle plus one card per visible tier; the Plans page frames it in a card, dialogs embed it. */
export function PlanCatalog({
  tiers,
  onCompareFeatures,
  embedded,
  ...actions
}: {
  tiers: PlanTier[]
  /** Opens and scrolls to the compare card. Without it, the link just jumps to the anchor. */
  onCompareFeatures?: () => void
  /** Inside a modal: no card frame and no compare link, as the compare table isn't there. */
  embedded?: boolean
} & PlanCardActions) {
  const [cycle, setCycle] = useState<Cycle>('month')
  const [seatsByPlan, setSeatsByPlan] = useState<Record<string, string>>({})
  const visible = getVisibleTiers(getCatalogTiers(tiers), cycle)

  const catalog = (
    <div className="@container flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Tabs value={cycle} onValueChange={(value) => setCycle(value as Cycle)}>
          <TabsList aria-label="Billing cycle">
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="year">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>

        {!embedded && (
          <Link
            href={`#${COMPARE_FEATURES_ID}`}
            variant="muted"
            className="hidden whitespace-nowrap @2xl:inline"
            onClick={(event) => {
              if (!onCompareFeatures) return
              event.preventDefault()
              onCompareFeatures()
            }}
          >
            Compare all features <ArrowDown />
          </Link>
        )}
      </div>

      {/* One shared row track per card section (the cards subgrid into it), so rows align whatever wraps. */}
      <div className="group/plans flex flex-col gap-5 @4xl:grid @4xl:auto-cols-[minmax(0,1fr)] @4xl:grid-flow-col @4xl:grid-rows-[auto_auto_auto_1fr_auto] @4xl:gap-x-5 @4xl:gap-y-0">
        {visible.map((tier) => (
          <PlanCard
            key={tier.id}
            tier={tier}
            seatsLabel={seatsByPlan[tier.name]}
            onSeatsChange={(label) => setSeatsByPlan((picked) => ({ ...picked, [tier.name]: label }))}
            counterpartTier={tiers.find(
              (other) =>
                other.name === tier.name && other.billingCycle !== null && other.billingCycle !== tier.billingCycle,
            )}
            onSwitchToYearly={() => setCycle('year')}
            {...actions}
          />
        ))}
      </div>

      {actions.readOnly && (
        <Typography variant="paragraph-small" color="muted" align="center">
          {READ_ONLY_NOTE}
        </Typography>
      )}

      <Typography variant="paragraph-mini" color="muted" align="center">
        Terms apply:{' '}
        <Link href={SAFE_PRO_TERMS_URL} target="_blank" rel="noopener noreferrer" variant="muted">
          Safe Pro Terms
        </Link>
        {' · '}
        <Link href={SAFE_PRO_SERVICE_DESCRIPTIONS_URL} target="_blank" rel="noopener noreferrer" variant="muted">
          Service Descriptions
        </Link>
      </Typography>
    </div>
  )

  if (embedded) return catalog

  return (
    <Card radius="xl" size="sm">
      <CardContent>{catalog}</CardContent>
    </Card>
  )
}
