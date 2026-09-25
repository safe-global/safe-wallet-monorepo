import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useHasFeature } from '@/hooks/useChains'
import { cn } from '@/utils/cn'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { FEATURES } from '@safe-global/utils/utils/chains'
import AuthState from '../AuthState'
import Plans from './index'
import { buildPlanTiers, toCurrentPlan } from './planTiers'
import { useIsAdmin } from '../../hooks/useSpaceMembers'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useStartCheckout } from '../../hooks/billing/useStartCheckout'
import { useChangePlan } from '../../hooks/billing/useChangePlan'
import ChangePlanFlow from './ChangePlanFlow'
import type { PlanPick } from './types'

const PlansSkeleton = () => (
  <div className="flex flex-col gap-6" data-testid="plans-skeleton">
    <Skeleton className="h-49 w-full rounded-xl" />
    <Skeleton className="h-140 w-full rounded-xl" />
  </div>
)

export default function SpacePlansPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO)
  const { SafeProAnnouncement } = useLoadFeature(SafeProFeature)
  const { plan, seats, sponsoredTxs, subscription, isTrialing, isLoading: isPlanLoading } = useSpacePlan(spaceId)
  const { paidPlans, isLoading: isOffersLoading } = useSpaceOffers(spaceId)
  const { openPortal, isRedirecting } = useBillingPortal(spaceId)
  const { startCheckout, isRedirecting: isCheckingOut } = useStartCheckout(spaceId)
  const { canChange } = useChangePlan(spaceId)
  const isAdmin = useIsAdmin(spaceId)
  const [pick, setPick] = useState<PlanPick>()

  const currentPlan = useMemo(
    () => (canChange && subscription && plan ? toCurrentPlan(subscription, plan, isTrialing, seats?.quota) : undefined),
    [canChange, subscription, plan, isTrialing, seats?.quota],
  )
  const tiers = useMemo(
    () =>
      buildPlanTiers(paidPlans, currentPlan && subscription ? { subscription, seatsQuota: seats?.quota } : undefined),
    [paidPlans, currentPlan, subscription, seats?.quota],
  )

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
          Plans
        </Typography>

        {!isSafePro ? (
          <Card
            size="none"
            // eslint-disable-next-line no-restricted-syntax -- Figma's 32px corner has no Card `radius` option
            className="w-full rounded-4xl"
          >
            <SafeProAnnouncement location="plans_page" />
          </Card>
        ) : isPlanLoading || isOffersLoading ? (
          <PlansSkeleton />
        ) : (
          <Plans
            plan={plan}
            safeAccounts={seats}
            sponsoredTxs={sponsoredTxs}
            tiers={tiers}
            onManage={() => void openPortal()}
            isManaging={isRedirecting}
            canManage={plan?.status === 'active' || (plan === null && subscription !== undefined)}
            onSubscribe={(picked) => {
              if (canChange) setPick(picked)
              else if (picked.option.paymentLinkId) void startCheckout(picked.option.paymentLinkId)
            }}
            isSubscribing={isCheckingOut}
            currentPlan={currentPlan}
            readOnly={!isAdmin}
          />
        )}

        {pick && currentPlan && (
          <ChangePlanFlow spaceId={spaceId} pick={pick} currentPlan={currentPlan} onClose={() => setPick(undefined)} />
        )}
      </div>
    </AuthState>
  )
}
