import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import { useDarkMode } from '@/hooks/useDarkMode'
import SafeProLockup from '@/public/images/safe-pro/safe-pro-lockup.svg'
import SafeProLockupDark from '@/public/images/safe-pro/safe-pro-lockup-dark.svg'
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
  const isDarkMode = useDarkMode()
  const Lockup = isDarkMode ? SafeProLockupDark : SafeProLockup

  return (
    <Card radius="xl" size="sm" data-testid="plans-sales-prompt">
      <CardContent className="@container">
        {/* Same column track as the plan cards, so the button sits under the Enterprise buttons. */}
        <div className="group/plan flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between @4xl:grid @4xl:grid-cols-3 @4xl:gap-x-5">
          <div className="flex flex-col items-start gap-3 @md:flex-row @md:items-center @md:gap-5 @4xl:col-span-2">
            <Lockup aria-hidden className="h-10 w-auto shrink-0" />
            <div className="flex flex-col gap-0.5">
              <Typography variant="paragraph-bold">{SALES_PROMPT_V2.prompt}</Typography>
              <Typography variant="paragraph-small" color="muted">
                {SALES_PROMPT_V2.detail}
              </Typography>
            </div>
          </div>
          <div className="@4xl:px-4">
            <Button
              variant="outline"
              size="lg"
              weight="semibold"
              className="w-full @2xl:w-auto @4xl:w-full"
              render={<a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />}
              onClick={trackSalesPrompt}
            >
              {SALES_PROMPT_V2.action}
              <CtaArrow variant="reveal" external />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
