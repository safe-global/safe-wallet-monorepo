import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { SALES_PROMPT_V2 } from '../planCatalog'
import { CtaArrow } from './CtaArrow'

const trackSalesPrompt = () =>
  trackEvent(
    { ...SAFE_PRO_EVENTS.PLANS_CLICKED, label: SAFE_PRO_PLANS_LABELS.sales_prompt },
    { [MixpanelEventParams.LOCATION]: SAFE_PRO_PLANS_LABELS.sales_prompt },
  )

export default function SalesPromptCard() {
  return (
    <Card radius="xl" size="sm" data-testid="plans-sales-prompt">
      <CardContent className="group/plan flex flex-wrap items-center justify-between">
        <Typography variant="paragraph-medium" className="mr-4">
          {SALES_PROMPT_V2.prompt}
        </Typography>
        <Button
          variant="outline"
          size="lg"
          weight="semibold"
          render={<a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />}
          onClick={trackSalesPrompt}
        >
          {SALES_PROMPT_V2.action}
          <CtaArrow variant="reveal" external />
        </Button>
      </CardContent>
    </Card>
  )
}
