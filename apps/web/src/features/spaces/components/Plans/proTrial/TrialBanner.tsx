import { useState } from 'react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { differenceInCalendarDays } from 'date-fns'
import { CalendarClock } from 'lucide-react'
import { Alert } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Link } from '@safe-global/views/components/ui/link'
import { Typography } from '@safe-global/views/components/ui/typography'
import { formatWithSchema } from '@safe-global/utils/utils/date'
import { cn } from '@safe-global/views/utils/cn'
import { AppRoutes } from '@/config/routes'
import { useDarkMode } from '@/hooks/useDarkMode'
import { CONTACT_SALES_URL } from '../../../constants'
import { useIsAdmin } from '../../../hooks/useSpaceMembers'
import { useSpacePlan } from '../../../hooks/useSpacePlan'
import { PRO_TRIAL_COPY } from './copy'
import { isSalesLed } from './recommendPlan'
import UpgradeHandoffModal from './UpgradeHandoffModal'
import { useRecommendedPick } from './useRecommendedPick'

/** From this many calendar days left the banner names a plan to upgrade to. */
export const URGENT_TRIAL_DAYS = 3

/** The #9473 trial banner: one quiet line while the trial has time left, a named upgrade in its last days. */
export default function TrialBanner({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const isDarkMode = useDarkMode()
  const { isTrialing, plan } = useSpacePlan(spaceId)
  const isAdmin = useIsAdmin(spaceId)
  const { pick } = useRecommendedPick(spaceId)
  const [handoff, setHandoff] = useState<typeof pick>()

  const endsAt = isTrialing && plan?.periodEndsAt ? Date.parse(plan.periodEndsAt) : NaN
  // The Plans page shows the trial in its own status card.
  if (Number.isNaN(endsAt) || router.pathname === AppRoutes.spaces.plans) return null

  const daysLeft = Math.max(differenceInCalendarDays(endsAt, Date.now()), 0)
  const isUrgent = daysLeft <= URGENT_TRIAL_DAYS
  const endsOn = formatWithSchema(endsAt, 'MMM d')
  const planName = pick ? PRO_TRIAL_COPY.planName(pick.tier.name, pick.option.seats) : undefined
  const isSalesPick = pick ? isSalesLed(pick.option.seats ?? null) : false

  return (
    <div className={cn('shadcn-scope mb-6', isDarkMode && 'dark')}>
      <Alert
        variant={isUrgent ? 'info' : 'subtle'}
        role="region"
        aria-label={PRO_TRIAL_COPY.banner.regionLabel}
        className="py-2.5"
        data-testid="pro-trial-banner"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarClock aria-hidden className="size-4 shrink-0" />
            <Typography
              variant={isUrgent ? 'paragraph-small-medium' : 'paragraph-small'}
              color={isUrgent ? 'default' : 'muted'}
            >
              {isUrgent ? PRO_TRIAL_COPY.banner.urgent(daysLeft, endsOn) : PRO_TRIAL_COPY.banner.normal(endsOn)}
            </Typography>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {isUrgent && isAdmin && planName ? (
              <>
                {!isSalesPick && (
                  <Link href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" variant="muted">
                    {PRO_TRIAL_COPY.talkToUs}
                  </Link>
                )}
                {isSalesPick ? (
                  <Button size="sm" render={<a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />}>
                    {PRO_TRIAL_COPY.talkToUs}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setHandoff(pick)} data-testid="pro-trial-upgrade">
                    {PRO_TRIAL_COPY.upgradeTo(planName)}
                  </Button>
                )}
              </>
            ) : (
              <Link
                render={<NextLink href={{ pathname: AppRoutes.spaces.plans, query: { spaceId } }} />}
                variant="muted"
              >
                {PRO_TRIAL_COPY.banner.seePlans}
              </Link>
            )}
          </div>
        </div>
      </Alert>
      <UpgradeHandoffModal spaceId={spaceId} pick={handoff} onClose={() => setHandoff(undefined)} />
    </div>
  )
}
