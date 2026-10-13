import { ArrowUpRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import { useDarkMode } from '@/hooks/useDarkMode'
import SafeProLockup from '@/public/images/safe-pro/safe-pro-lockup.svg'
import SafeProLockupDark from '@/public/images/safe-pro/safe-pro-lockup-dark.svg'
import { SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { trackPlansClick } from './planTiers'

export default function SalesPromptCard() {
  const isDarkMode = useDarkMode()
  const Lockup = isDarkMode ? SafeProLockupDark : SafeProLockup

  return (
    <Card radius="xl" size="sm" data-testid="plans-sales-prompt">
      <CardContent className="@container">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Typography variant="paragraph-bold">Not sure which plan fits?</Typography>
            <Button
              variant="outline"
              size="sm"
              weight="semibold"
              render={<a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />}
              onClick={() => trackPlansClick(SAFE_PRO_PLANS_LABELS.sales_prompt)}
            >
              Talk to sales
              <ArrowUpRight data-icon="inline-end" />
            </Button>
          </div>
          <Lockup aria-hidden className="hidden h-7 w-auto shrink-0 @md:block" />
        </div>
      </CardContent>
    </Card>
  )
}
