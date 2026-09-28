import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { List, ListItem, ListItemText } from '@/components/ui/list'
import { Typography } from '@/components/ui/typography'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import { PLAN_EXTRAS_V2 } from '../planCatalog'
import { CtaArrow } from './CtaArrow'
import { FeatureCheck } from './FeatureCheck'
import { trackPlansV2Click, type PlansV2ClickLocation } from './trackPlansV2Click'

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
  location: PlansV2ClickLocation
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
          onClick={() => trackPlansV2Click(location)}
        >
          {action}
          <CtaArrow variant="reveal" external />
        </Button>
      </div>
    </CardContent>
  </Card>
)

/** Coming soon and the Hypernative add-on, side by side with their buttons level; stacked on mobile. */
export default function PlanExtrasV2() {
  const { comingSoon, addOn } = PLAN_EXTRAS_V2

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <ExtraCard
        tag={comingSoon.tag}
        title={comingSoon.title}
        action={comingSoon.action}
        location="request_updates"
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
        location="discuss_add_on"
        testId="plans-add-on"
      >
        <Typography variant="paragraph-small" color="muted">
          {addOn.description}
        </Typography>
      </ExtraCard>
    </div>
  )
}
