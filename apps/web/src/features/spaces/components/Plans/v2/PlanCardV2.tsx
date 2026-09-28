import { useEffect, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { List, ListItem, ListItemText } from '@/components/ui/list'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import { Seats } from '../PlanCards'
import { getPlanContentV2, PLAN_CARD_COPY_V2 } from '../planCatalog'
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

const PlanCtaV2 = ({ pick, currentPlan, onSubscribe, onManage, isBusy }: { pick: PlanPick } & PlanCardV2Actions) => {
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
      return (
        <Button size="lg" weight="semibold" accentIcon className="w-full" disabled={isBusy} onClick={onManage}>
          {cta.label}
          <ArrowRight data-icon="inline-end" />
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

export const PlanCardV2 = ({ tier, ...actions }: { tier: PlanTier } & PlanCardV2Actions) => {
  const content = getPlanContentV2(tier.name)
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
      variant={tier.isCurrent ? 'default' : 'muted-secondary'}
      elevated={Boolean(tier.isCurrent)}
      radius="lg-xl"
      className="flex-1"
      data-testid={tier.isCurrent ? 'current-plan-card' : 'plan-card'}
    >
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Typography variant="h4">{tier.name}</Typography>
          {content && <Typography color="muted">{content.description}</Typography>}
        </div>

        {price && (
          <div className="flex items-baseline gap-1">
            <Typography variant="h4">{price.headline}</Typography>
            <Typography color="muted">{price.suffix}</Typography>
          </div>
        )}

        {option && (
          <div className="flex flex-col gap-2.5">
            <Seats
              options={tier.options}
              value={option}
              onChange={setOption}
              label={`${PLAN_CARD_COPY_V2.seatsLabel} ${tier.name}`}
            />
            {!actions.readOnly && <PlanCtaV2 pick={{ tier, option }} {...actions} />}
            {price && (
              <Typography variant="paragraph-mini" color="muted" align="center" data-testid="plan-price-line">
                {price.line}
              </Typography>
            )}
          </div>
        )}

        <Separator />

        <div className="flex flex-1 flex-col gap-3">
          {content && <Typography variant="paragraph-small-medium">{content.featuresHeading}</Typography>}
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

        {content && (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
