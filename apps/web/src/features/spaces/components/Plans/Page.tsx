import { useMemo, useState } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { BillingPeriod, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import AuthState from '../AuthState'
import Plans from './index'
import { RECOMMENDED_PLAN } from '@views/features/spaces/components/Plans/planCatalog'
import { takePlansEntry } from './planSelection'
import { buildPlanTiers, pickProps, toCurrentPlan } from './planTiers'
import { useIsAdmin } from '../../hooks/useSpaceMembers'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useStartCheckout } from '../../hooks/billing/useStartCheckout'
import { useChangePlan } from '../../hooks/billing/useChangePlan'
import ChangePlanFlow from './ChangePlanFlow'
import type { PlanPick, PlanTier } from '@views/features/spaces/components/Plans/types'
import { PageView } from '@views/features/spaces/components/Plans/PageView'

const ANNOUNCEMENT_LOCATION = 'plans_page'

/** The seats the recommended card opens on, the same option its card picks first. */
const defaultSeats = (tiers: PlanTier[]): number | undefined => {
  const tier = tiers.find((candidate) => candidate.name === RECOMMENDED_PLAN && candidate.billingCycle !== 'year')
  const option = tier?.options.find((candidate) => candidate.priceId === tier.currentPriceId) ?? tier?.options[0]
  return option?.seats ?? undefined
}

export default function SpacePlansPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()
  const isSafePro = useIsSafeProEnabled()
  const { SafeProAnnouncement } = useLoadFeature(SafeProFeature)
  const {
    plan,
    seats,
    sponsoredTxs,
    subscription,
    isTrialing,
    isLoading: isPlanLoading,
    isUninitialized,
  } = useSpacePlan(spaceId)
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
  const [entry] = useState(takePlansEntry)
  const isReady = isSafePro && !isPlanLoading && !isOffersLoading && !isUninitialized
  useTrackOnce(
    SAFE_PRO_EVENTS.PLANS_PAGE_VIEWED,
    {
      ...entry,
      [MixpanelEventParams.DEFAULT_SEATS]: defaultSeats(tiers),
      [MixpanelEventParams.DEFAULT_BILLING_PERIOD]: BillingPeriod.MONTHLY,
      [MixpanelEventParams.PLAN_LIMIT]: seats?.quota ?? undefined,
      [MixpanelEventParams.SPONSORED_REMAINING]:
        sponsoredTxs?.quota != null ? sponsoredTxs.quota - sponsoredTxs.used : undefined,
      [MixpanelEventParams.SPONSORED_QUOTA]: sponsoredTxs?.quota ?? undefined,
    },
    isReady,
  )

  return (
    <AuthState spaceId={spaceId}>
      <PageView
        isDarkMode={isDarkMode}
        isSafePro={isSafePro}
        isLoading={isPlanLoading || isOffersLoading}
        announcement={<SafeProAnnouncement location={ANNOUNCEMENT_LOCATION} />}
        plans={
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
              else if (picked.option.paymentLinkId) {
                void startCheckout(picked.option.paymentLinkId, { ...pickProps(picked), ...entry })
              }
            }}
            isSubscribing={isCheckingOut}
            currentPlan={currentPlan}
            readOnly={!isAdmin}
          />
        }
        changePlanFlow={
          pick &&
          currentPlan && (
            <ChangePlanFlow
              spaceId={spaceId}
              pick={pick}
              currentPlan={currentPlan}
              entry={entry}
              onClose={() => setPick(undefined)}
            />
          )
        }
      />
    </AuthState>
  )
}
