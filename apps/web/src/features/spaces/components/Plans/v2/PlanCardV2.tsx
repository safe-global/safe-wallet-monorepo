import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { List, ListItem } from '@/components/ui/list'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { cn } from '@/utils/cn'
import { Seats } from '../PlanCards'
import { getCardFeaturesV2, getPlanContentV2, PLAN_CARD_COPY_V2, RECOMMENDED_PLAN } from '../planCatalog'
import type { CurrentPlan, PlanPick, PlanSeatOption, PlanTier } from '../types'
import { FeatureCheck } from './FeatureCheck'
import { getCardSavingV2, getPlanCtaV2, getPlanPriceV2 } from './planCardsV2'

export type PlanCardV2Actions = {
  onSubscribe?: (pick: PlanPick) => void
  onManage?: () => void
  isBusy?: boolean
  currentPlan?: CurrentPlan
  /** Non-admin member: no plan buttons. */
  readOnly?: boolean
}

/** Mint underline behind the support level that draws in while the card is hovered or focused. */
const SUPPORT_HIGHLIGHT_CLASSES = [
  'absolute -inset-x-[0.08em] bottom-[calc(6px-0.06em)] -z-10 h-1 origin-left bg-mint dark:bg-mint/40',
  'scale-x-0 transition-transform duration-[450ms] ease-soft motion-reduce:transition-none',
  'group-hover/plan:scale-x-100 group-hover/plan:delay-75 group-focus-within/plan:scale-x-100',
].join(' ')

/** The current card is white until another plan card is hovered, so only one card is white at a time. */
const CURRENT_YIELDS_TO_HOVER_CLASSES =
  'transition-colors duration-200 motion-reduce:transition-none group-has-[[data-hover-plan]:hover]/plans:bg-muted-secondary'

const optionKey = (option: PlanSeatOption) => option.priceId ?? option.paymentLinkId ?? option.label

/** Outline link to sales, tracked by which card sent the user there. */
const SalesCtaV2 = ({ label, kind }: { label: string; kind: 'sales' | 'account-team' }) => (
  <Button
    variant="outline"
    size="lg"
    weight="semibold"
    className="w-full"
    render={<a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />}
    onClick={() => {
      const location = kind === 'sales' ? SAFE_PRO_PLANS_LABELS.talk_to_sales : SAFE_PRO_PLANS_LABELS.account_team
      trackEvent({ ...SAFE_PRO_EVENTS.PLANS_CLICKED, label: location }, { [MixpanelEventParams.LOCATION]: location })
    }}
  >
    {label}
    <ArrowUpRight data-icon="inline-end" />
  </Button>
)

const PlanCtaV2 = ({
  pick,
  isPrimary,
  currentPlan,
  onSubscribe,
  onManage,
  isBusy,
}: { pick: PlanPick; isPrimary: boolean } & PlanCardV2Actions) => {
  const cta = getPlanCtaV2(pick, currentPlan)

  switch (cta.kind) {
    case 'sales':
    case 'account-team':
      return <SalesCtaV2 label={cta.label} kind={cta.kind} />
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
          onClick={cta.kind === 'billing' ? onManage : () => onSubscribe?.(pick)}
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

export const PlanCardV2 = ({
  tier,
  seatsLabel,
  onSeatsChange,
  yearlyTier,
  onSwitchToYearly,
  ...actions
}: {
  tier: PlanTier
  /** Safe count picked on the other billing cycle, so switching cycles keeps it. */
  seatsLabel?: string
  onSeatsChange?: (label: string) => void
  /** The same plan billed yearly, so a monthly card can show what switching saves. */
  yearlyTier?: PlanTier
  onSwitchToYearly?: () => void
} & PlanCardV2Actions) => {
  const content = getPlanContentV2(tier.name)
  const isPrimary = tier.name === RECOMMENDED_PLAN
  // Follows the plan, not the billing cycle, so the highlight stays when switching monthly/yearly.
  const isCurrentPlan = tier.isCurrent || actions.currentPlan?.name === tier.name
  // Tracked by key: tiers are rebuilt every render.
  const [pickedKey, setPickedKey] = useState<string>()
  const option =
    tier.options.find((candidate) => optionKey(candidate) === pickedKey) ??
    tier.options.find((candidate) => candidate.label === seatsLabel) ??
    tier.options.find((candidate) => candidate.priceId === tier.currentPriceId) ??
    tier.options.find((candidate) => isCurrentPlan && candidate.label === actions.currentPlan?.seatsLabel) ??
    tier.options[0]
  const price = option ? getPlanPriceV2(tier, option) : undefined
  const isYearly = tier.billingCycle === 'year'
  const saving = getCardSavingV2(tier, option, yearlyTier)
  const features = getCardFeaturesV2(tier.name) ?? tier.features

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
        isCurrentPlan && CURRENT_YIELDS_TO_HOVER_CLASSES,
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
                {PLAN_CARD_COPY_V2.current}
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
              {PLAN_CARD_COPY_V2.savedVsMonthly(saving.amount, saving.percent)}
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
                {PLAN_CARD_COPY_V2.saveWithYearly(saving.amount, saving.percent)}
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
                onChange={(next) => {
                  setPickedKey(optionKey(next))
                  onSeatsChange?.(next.label)
                }}
                label={`${PLAN_CARD_COPY_V2.seatsLabel} ${tier.name}`}
              />
              {!actions.readOnly && (
                <div className="flex flex-wrap gap-2 *:min-w-max *:flex-1 *:basis-0" data-testid="plan-ctas">
                  <PlanCtaV2 pick={{ tier, option }} isPrimary={isPrimary} {...actions} />
                  {isPrimary && <SalesCtaV2 label={PLAN_CARD_COPY_V2.talkToSales} kind="sales" />}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-6 @2xl:@max-4xl:col-start-2 @2xl:@max-4xl:row-span-4 @2xl:@max-4xl:row-start-1 @2xl:@max-4xl:mt-0">
          <Separator className="@2xl:@max-4xl:hidden" />
          <div className="flex flex-col gap-3">
            {content && (
              <Typography variant="paragraph-small-bold">
                {PLAN_CARD_COPY_V2.featuresHeading(content.support.level)}
              </Typography>
            )}
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
                <div className="flex items-center justify-between gap-2">
                  <Typography variant="paragraph-medium">{PLAN_CARD_COPY_V2.supportLabel}</Typography>
                  <Typography variant="paragraph-bold" className="relative isolate" data-testid="plan-support-level">
                    {content.support.level}
                    <span aria-hidden className={SUPPORT_HIGHLIGHT_CLASSES} />
                  </Typography>
                </div>
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
