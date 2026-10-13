import { ArrowUpRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import { useDarkMode } from '@/hooks/useDarkMode'
import SafeProLockup from '@/public/images/safe-pro/safe-pro-lockup.svg'
import SafeProLockupDark from '@/public/images/safe-pro/safe-pro-lockup-dark.svg'
import Track from '@/components/common/Track'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { PlanLocation } from '@/services/analytics/mixpanel-events'
import { plansClickParams } from './planTiers'

export default function SalesPromptCard() {
  const isDarkMode = useDarkMode()
  const Lockup = isDarkMode ? SafeProLockupDark : SafeProLockup

  return (
    <Card radius="xl" size="sm" data-testid="plans-sales-prompt">
      <CardContent className="@container">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Typography variant="paragraph-bold">Not sure which plan fits?</Typography>
            <Track
              {...SAFE_PRO_EVENTS.PLANS_CLICKED}
              label={SAFE_PRO_PLANS_LABELS.sales_prompt}
              mixpanelParams={plansClickParams(SAFE_PRO_PLANS_LABELS.sales_prompt, PlanLocation.PLANS_PAGE)}
            >
              <Button
                variant="outline"
                size="sm"
                weight="semibold"
                render={<a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />}
              >
                Talk to sales
                <ArrowUpRight data-icon="inline-end" />
              </Button>
            </Track>
          </div>
          <Lockup aria-hidden className="hidden h-7 w-auto shrink-0 @md:block" />
        </div>
      </CardContent>
    </Card>
  )
}
