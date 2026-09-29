import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { List, ListItem, ListItemText } from '@/components/ui/list'
import { Typography } from '@/components/ui/typography'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { PLAN_EXTRAS_V2 } from '../planCatalog'
import { CtaArrow } from './CtaArrow'
import { FeatureCheck } from './FeatureCheck'

const ExtraCard = ({
  tag,
  title,
  action,
  location,
  children,
  testId,
}: {
  tag: string
  title: string
  action: string
  location: SAFE_PRO_PLANS_LABELS
  children: ReactNode
  testId: string
}) => (
  <Card radius="xl" className="group/plan" data-testid={testId}>
    <CardContent className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" size="status" shape="status">
            {tag}
          </Badge>
          <Typography variant="h4">{title}</Typography>
        </div>
        <div className="flex-1">{children}</div>
        <Button
          variant="outline"
          size="lg"
          weight="semibold"
          className="self-start"
          render={<a href={SUPPORT_CHAT_URL} target="_blank" rel="noopener noreferrer" />}
          onClick={() =>
            trackEvent(
              { ...SAFE_PRO_EVENTS.PLANS_CLICKED, label: location },
              { [MixpanelEventParams.LOCATION]: location },
            )
          }
        >
          {action}
          <CtaArrow variant="reveal" external />
        </Button>
      </div>
    </CardContent>
  </Card>
)

export default function PlanExtrasV2() {
  const { comingSoon, addOn } = PLAN_EXTRAS_V2

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <ExtraCard
        tag={comingSoon.tag}
        title={comingSoon.title}
        action={comingSoon.action}
        location={SAFE_PRO_PLANS_LABELS.request_updates}
        testId="plans-coming-soon"
      >
        <List className="gap-3">
          {comingSoon.items.map((item) => (
            <ListItem key={item} size="sm" className="py-0">
              <FeatureCheck />
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
      </ExtraCard>

      <ExtraCard
        tag={addOn.tag}
        title={addOn.title}
        action={addOn.action}
        location={SAFE_PRO_PLANS_LABELS.discuss_add_on}
        testId="plans-add-on"
      >
        <Typography variant="paragraph-small" color="muted">
          {addOn.description}
        </Typography>
      </ExtraCard>
    </div>
  )
}
