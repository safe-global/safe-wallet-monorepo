import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { CtaArrow } from './CtaArrow'
import { FeatureCheck } from './FeatureCheck'
import { getPlanCtaV2, getPlanPriceV2 } from './planCardsV2'

export type PlanCardV2Actions = {
  onSubscribe?: (pick: PlanPick) => void
  onManage?: () => void
  isBusy?: boolean
  currentPlan?: CurrentPlan
  /** Non-admin member: no plan buttons. */
  readOnly?: boolean
}

const optionKey = (option: PlanSeatOption) => option.priceId ?? option.paymentLinkId ?? option.label

const salesLink = <a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />

/** Mint underline behind the support level that draws in while the card is hovered or focused. */
const SUPPORT_HIGHLIGHT_CLASSES = [
  'absolute -inset-x-[0.08em] bottom-[calc(6px-0.06em)] -z-10 h-1 origin-left bg-mint dark:bg-mint/40',
  'scale-x-0 transition-transform duration-[450ms] ease-soft motion-reduce:transition-none',
  'group-hover/plan:scale-x-100 group-hover/plan:delay-75 group-focus-within/plan:scale-x-100',
]

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
      return (
        <Button
          variant="outline"
          size="lg"
          weight="semibold"
          className="w-full"
          render={salesLink}
          onClick={() => {
            const label =
              cta.kind === 'sales' ? SAFE_PRO_PLANS_LABELS.talk_to_sales : SAFE_PRO_PLANS_LABELS.account_team
            trackEvent({ ...SAFE_PRO_EVENTS.PLANS_CLICKED, label }, { [MixpanelEventParams.LOCATION]: label })
          }}
        >
          {cta.label}
          <CtaArrow variant="reveal" external />
        </Button>
      )
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
          <CtaArrow variant={isPrimary ? 'nudge' : 'reveal'} />
        </Button>
      )
    default: {
      const _exhaustive: never = cta
      return _exhaustive
    }
  }
}

export const PlanCardV2 = ({ tier, ...actions }: { tier: PlanTier } & PlanCardV2Actions) => {
  const content = getPlanContentV2(tier.name)
  const isPrimary = tier.name === RECOMMENDED_PLAN
  // Tracked by key: tiers are rebuilt every render.
  const [pickedKey, setPickedKey] = useState<string>()
  const option =
    tier.options.find((candidate) => optionKey(candidate) === pickedKey) ??
    tier.options.find((candidate) => candidate.priceId === tier.currentPriceId) ??
    tier.options[0]
  const price = option ? getPlanPriceV2(tier, option) : undefined
  const features = getCardFeaturesV2(tier.name) ?? tier.features

  // Always render all five rows so the subgrid lines up across cards.
  return (
    <Card
      variant="muted-secondary"
      hairline
      highlightOnHover
      size="offer"
      radius="lg-xl"
      className="group/plan min-w-0 @4xl:row-span-5 @4xl:grid @4xl:grid-rows-subgrid"
      data-testid={tier.isCurrent ? 'current-plan-card' : 'plan-card'}
      data-primary={isPrimary || undefined}
    >
      <CardContent className="flex min-w-0 flex-col @2xl:@max-4xl:grid @2xl:@max-4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @2xl:@max-4xl:grid-rows-[auto_1fr_auto_auto_auto] @2xl:@max-4xl:gap-x-10 @4xl:row-span-5 @4xl:grid @4xl:grid-cols-[minmax(0,1fr)] @4xl:grid-rows-subgrid">
        <div className="flex flex-col gap-1.5 @2xl:@max-4xl:col-start-1 @2xl:@max-4xl:row-start-1">
          <Typography variant="h4">{tier.name}</Typography>
          {content && (
            <Typography variant="paragraph-small" color="muted">
              {content.description}
            </Typography>
          )}
        </div>

        <div className="mt-5 flex items-baseline gap-1 @2xl:@max-4xl:col-start-1 @2xl:@max-4xl:row-start-3">
          {price && (
            <>
              <Typography variant="h3">{price.headline}</Typography>
              <Typography variant="paragraph-small" color="muted">
                {price.suffix}
              </Typography>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2.5 @2xl:@max-4xl:col-start-1 @2xl:@max-4xl:row-start-4">
          {option && (
            <>
              <Seats
                options={tier.options}
                value={option}
                onChange={(next) => setPickedKey(optionKey(next))}
                label={`${PLAN_CARD_COPY_V2.seatsLabel} ${tier.name}`}
              />
              {!actions.readOnly && <PlanCtaV2 pick={{ tier, option }} isPrimary={isPrimary} {...actions} />}
              {price && (
                <Typography variant="paragraph-mini" color="muted" align="center" data-testid="plan-price-line">
                  {price.line}
                </Typography>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-6 @2xl:@max-4xl:col-start-2 @2xl:@max-4xl:row-span-4 @2xl:@max-4xl:row-start-1 @2xl:@max-4xl:mt-0">
          <Separator className="@2xl:@max-4xl:hidden" />
          <div className="flex flex-col gap-3">
            {content && <Typography variant="paragraph-small-bold">{PLAN_CARD_COPY_V2.featuresHeading}</Typography>}
            <List className="gap-3">
              {features.map((feature, index) => (
                <ListItem key={feature} size="sm" className="items-start py-0">
                  <FeatureCheck followsPlanHover index={index} />
                  <Typography variant="paragraph-small">{feature}</Typography>
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
                    <span aria-hidden className={cn(SUPPORT_HIGHLIGHT_CLASSES)} />
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
