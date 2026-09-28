import { useEffect, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { List, ListItem, ListItemText } from '@/components/ui/list'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import { Seats } from '../PlanCards'
import { getPlanContentV2, PLAN_CARD_COPY_V2, RECOMMENDED_PLAN } from '../planCatalog'
import { getPlanPriceV2 } from '../perSafePrice'
import type { CurrentPlan, PlanPick, PlanSeatOption, PlanTier } from '../types'
import { getPlanCtaV2 } from './planCardsV2'

export type PlanCardV2Actions = {
  onSubscribe?: (pick: PlanPick) => void
  onManage?: () => void
  isBusy?: boolean
  currentPlan?: CurrentPlan
  /** A Workspace member who is not an admin: the cards show no plan buttons. */
  readOnly?: boolean
}

const salesLink = <a href={SUPPORT_CHAT_URL} target="_blank" rel="noopener noreferrer" />

/** Only the recommended plan's card gets the filled button; every other action stays outlined. */
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
        <Button variant="outline" size="lg" weight="semibold" className="w-full" render={salesLink}>
          {cta.label}
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
          {isPrimary && <ArrowRight data-icon="inline-end" />}
        </Button>
      )
  }
}

export const PlanCardV2 = ({ tier, ...actions }: { tier: PlanTier } & PlanCardV2Actions) => {
  const content = getPlanContentV2(tier.name)
  const isPrimary = tier.name === RECOMMENDED_PLAN
  const currentOption = tier.options.find((candidate) => candidate.priceId === tier.currentPriceId)
  const [option, setOption] = useState<PlanSeatOption | undefined>(currentOption ?? tier.options[0])
  // The subscription can land after the card mounted; the selector must then snap to the plan in force.
  useEffect(() => {
    if (currentOption) setOption(currentOption)
  }, [currentOption])
  const price = option ? getPlanPriceV2(tier, option) : undefined
  const features = content?.features ?? tier.features

  return (
    <Card
      variant="muted-secondary"
      elevated={isPrimary}
      hairline
      highlightOnHover
      size="offer"
      radius="lg-xl"
      className="group/plan flex-1"
      data-testid={tier.isCurrent ? 'current-plan-card' : 'plan-card'}
      data-primary={isPrimary || undefined}
    >
      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-1 flex-col gap-5">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Typography variant="h4">{tier.name}</Typography>
                {content && (
                  <Typography variant="paragraph-small" color="muted">
                    {content.description}
                  </Typography>
                )}
              </div>

              {price && (
                <div className="flex items-baseline gap-1">
                  <Typography variant="h3">{price.headline}</Typography>
                  <Typography variant="paragraph-small" color="muted">
                    {price.suffix}
                  </Typography>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              {option && (
                <div className="flex flex-col gap-2.5">
                  <Seats
                    options={tier.options}
                    value={option}
                    onChange={setOption}
                    label={`${PLAN_CARD_COPY_V2.seatsLabel} ${tier.name}`}
                  />
                  {!actions.readOnly && <PlanCtaV2 pick={{ tier, option }} isPrimary={isPrimary} {...actions} />}
                  {price && (
                    <Typography variant="paragraph-mini" color="muted" align="center" data-testid="plan-price-line">
                      {price.line}
                    </Typography>
                  )}
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-3">
                {content && <Typography variant="paragraph-small-bold">{content.featuresHeading}</Typography>}
                <List className="gap-3">
                  {features.map((feature) => (
                    <ListItem key={feature} size="sm" className="py-0">
                      <span
                        aria-hidden
                        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover/plan:bg-foreground group-hover/plan:text-background group-focus-within/plan:bg-foreground group-focus-within/plan:text-background"
                        data-testid="plan-feature-check"
                      >
                        <Check className="size-3" strokeWidth={2} />
                      </span>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </div>
            </div>
          </div>

          {content && (
            <div className="flex flex-col gap-5">
              <Separator />
              <div className="flex flex-col gap-1" data-testid="plan-support">
                <div className="flex items-center justify-between gap-2">
                  <Typography variant="paragraph-medium">{PLAN_CARD_COPY_V2.supportLabel}</Typography>
                  <Typography variant="paragraph-bold">{content.support.level}</Typography>
                </div>
                <Typography variant="paragraph-small" color="muted">
                  {content.support.detail}
                </Typography>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
