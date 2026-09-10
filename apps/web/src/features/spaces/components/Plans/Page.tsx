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
  const [isReminderOpen, setIsReminderOpen] = useState(false)

  const tiers = useMemo(
    () => buildPlanTiers({ paidPlans, subscription, seatsQuota: seats?.quota }),
    [paidPlans, subscription, seats?.quota],
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
            canManage={subscription !== undefined}
            onSubscribe={(paymentLinkId) => void startCheckout(paymentLinkId)}
            isSubscribing={isCheckingOut}
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
