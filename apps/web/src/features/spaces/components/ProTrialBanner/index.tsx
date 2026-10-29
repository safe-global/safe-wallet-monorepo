import { useContext } from 'react'
import { useRouter } from 'next/router'
import { differenceInCalendarDays } from 'date-fns'
import ProTrialBannerView from '@safe-global/views/features/spaces/components/ProTrialBanner'
import { cn } from '@safe-global/views/utils/cn'
import { TxModalContext } from '@/components/tx-flow'
import { AppRoutes } from '@/config/routes'
import { useDarkMode } from '@/hooks/useDarkMode'
import { CONTACT_SALES_URL } from '../../constants'
import { useIsAdmin } from '../../hooks/useSpaceMembers'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useMockTrial } from './mockTrial'
import MockTrialControl from './MockTrialControl'

/** From this many calendar days left (the last day included) the banner names a plan to upgrade to. */
export const URGENT_TRIAL_DAYS = 3

// Security shows safety warnings; Plans already shows the trial in its status card.
const HIDDEN_ROUTES: string[] = [AppRoutes.spaces.security, AppRoutes.spaces.plans]

/** The plan the Upgrade button names: the trial's own tier and seats until billing suggests one. */
export const _suggestedPlanName = (tierName: string | undefined, seatsQuota: number | null | undefined): string =>
  tierName ? (seatsQuota ? `${tierName} ${seatsQuota}` : tierName) : 'Safe Pro'

export default function ProTrialBanner({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const isDarkMode = useDarkMode()
  const { txFlow } = useContext(TxModalContext)
  const { isTrialing, plan, tierName, seats } = useSpacePlan(spaceId)
  const isAdmin = useIsAdmin(spaceId)
  const { mock, select, isAvailable } = useMockTrial()

  const realEndsAt = isTrialing && plan?.periodEndsAt ? Date.parse(plan.periodEndsAt) : NaN
  const endsAt = mock ? mock.endsAt : realEndsAt
  const isHidden = Boolean(txFlow) || HIDDEN_ROUTES.includes(router.pathname) || Number.isNaN(endsAt)
  const daysLeft = Math.max(differenceInCalendarDays(endsAt, Date.now()), 0)

  return (
    <>
      {!isHidden && (
        <div className={cn('shadcn-scope mb-6', isDarkMode && 'dark')}>
          <ProTrialBannerView
            endsAt={endsAt}
            daysLeft={daysLeft}
            isUrgent={daysLeft <= URGENT_TRIAL_DAYS}
            planName={mock ? 'Business 10' : _suggestedPlanName(tierName, seats?.quota)}
            plansHref={{ pathname: AppRoutes.spaces.plans, query: { spaceId } }}
            talkToUsHref={CONTACT_SALES_URL}
            canUpgrade={Boolean(mock) || isAdmin}
          />
        </div>
      )}
      {isAvailable && (
        <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
          <MockTrialControl value={mock?.state ?? null} onChange={select} />
        </div>
      )}
    </>
  )
}
