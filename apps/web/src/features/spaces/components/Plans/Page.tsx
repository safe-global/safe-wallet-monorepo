import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useHasFeature } from '@/hooks/useChains'
import { cn } from '@/utils/cn'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { localItem } from '@/services/local-storage/local'
import { FEATURES } from '@safe-global/utils/utils/chains'
import AuthState from '../AuthState'
import Plans from './index'
import { SPONSORED_TXS_PLACEHOLDER } from './fixtures'
import { buildPlanTiers } from './planTiers'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useStartCheckout } from '../../hooks/billing/useStartCheckout'
import { useChangePlan } from '../../hooks/billing/useChangePlan'
import ChangePlanDialog from './ChangePlanDialog'
import type { CurrentPlan, PlanPick } from './types'

const reminderSeen = localItem<boolean>('safeProBillingReminderSeen')

const PlansSkeleton = () => (
  <div className="flex flex-col gap-6" data-testid="plans-skeleton">
    <Skeleton className="h-[196px] w-full rounded-xl" />
    <Skeleton className="h-[560px] w-full rounded-xl" />
  </div>
)

export default function SpacePlansPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO)
  const { SafeProAnnouncement, SafeProBillingReminderModal } = useLoadFeature(SafeProFeature)
  const { plan, seats, subscription, isTrialing, isLoading: isPlanLoading } = useSpacePlan(spaceId)
  const { paidPlans, isLoading: isOffersLoading } = useSpaceOffers(spaceId)
  const { openPortal, isRedirecting } = useBillingPortal(spaceId)
  const { startCheckout, isRedirecting: isCheckingOut } = useStartCheckout(spaceId)
  const { canChange } = useChangePlan(spaceId)
  const [isReminderOpen, setIsReminderOpen] = useState(false)
  const [pick, setPick] = useState<PlanPick>()

  const currentPlan = useMemo<CurrentPlan | undefined>(
    () =>
      canChange && subscription && plan
        ? {
            name: subscription.plan.name ?? plan.name,
            price: subscription.plan.currentPrice,
            currency: subscription.plan.currency,
            billingCycle: subscription.plan.billingCycle ?? null,
            isTrialing,
            periodEndsAt: plan.periodEndsAt,
          }
        : undefined,
    [canChange, subscription, plan, isTrialing],
  )
  const tiers = useMemo(
    () =>
      buildPlanTiers(paidPlans, currentPlan && subscription ? { subscription, seatsQuota: seats?.quota } : undefined),
    [paidPlans, currentPlan, subscription, seats?.quota],
  )

  useEffect(() => {
    if (isTrialing && !reminderSeen.get()) setIsReminderOpen(true)
  }, [isTrialing])

  const closeReminder = () => {
    reminderSeen.set(true)
    setIsReminderOpen(false)
  }

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
          Plans
        </Typography>

        {!isSafePro ? (
          <Card
            size="none"
            // eslint-disable-next-line no-restricted-syntax -- Figma spec calls for a 32px corner one-off; no radius token in the scale matches it
            className="w-full rounded-[2rem]"
          >
            <SafeProAnnouncement location="plans_page" />
          </Card>
        ) : isPlanLoading || isOffersLoading ? (
          <PlansSkeleton />
        ) : (
          <Plans
            plan={plan}
            safeAccounts={seats}
            sponsoredTxs={SPONSORED_TXS_PLACEHOLDER}
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
          />
        )}

        {pick && currentPlan && (
          <ChangePlanDialog
            spaceId={spaceId}
            pick={pick}
            currentPlan={currentPlan}
            onClose={() => setPick(undefined)}
          />
        )}

        <SafeProBillingReminderModal
          open={isReminderOpen}
          onOpenChange={closeReminder}
          trialEndsAt={plan?.periodEndsAt ? new Date(plan.periodEndsAt).getTime() : 0}
          onAddBillingDetails={() => {
            closeReminder()
            void openPortal()
          }}
        />
      </div>
    </AuthState>
  )
}
