import { useEffect, useMemo, useState } from 'react'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { trackEvent } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { MixpanelEventParams, PlanLocation, PlanSelectionEntryPoint } from '@/services/analytics/mixpanel-events'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useCurrentMembership, useIsAdmin } from '../../hooks/useSpaceMembers'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { markTrialReminderSeen, wasTrialReminderSeen } from '../../store/trialReminder'
import ChangePlanFlow from './ChangePlanFlow'
import { ENTERPRISE_TIER } from '@views/features/spaces/components/Plans/planCatalog'
import { PlanCatalog } from './PlanCards'
import { salesHintFor } from './PlanChooserModal'
import { buildPlanTiers, toCurrentPlan } from './planTiers'
import type { CurrentPlan, PlanPick } from '@views/features/spaces/components/Plans/types'
import { TrialEndingModalView } from '@views/features/spaces/components/Plans/TrialEndingModalView'

export { _endsIn, reminderSubtitle } from '@views/features/spaces/components/Plans/TrialEndingModalView'

const TrialEndingChooser = ({
  spaceId,
  spaceName,
  currentPlan,
  seatsQuota,
  isAdmin,
  onClose,
}: {
  spaceId: string
  spaceName?: string
  currentPlan: CurrentPlan
  seatsQuota: number | null | undefined
  /** A member sees the same plans without any button to act on them. */
  isAdmin: boolean
  onClose: () => void
}) => {
  const { paidPlans, isLoading } = useSpaceOffers(spaceId)
  const { subscription } = useSpacePlan(spaceId)
  const { openPortal, isRedirecting } = useBillingPortal(spaceId)
  const [pick, setPick] = useState<PlanPick>()
  const [isChanged, setIsChanged] = useState(false)
  const tiers = useMemo(
    () =>
      buildPlanTiers(paidPlans, subscription ? { subscription, seatsQuota } : undefined).filter(
        (tier) => tier.id !== ENTERPRISE_TIER.id,
      ),
    [paidPlans, subscription, seatsQuota],
  )
  const entry = { [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.REMINDER_MODAL }
  useTrackOnce(
    SAFE_PRO_EVENTS.FREE_ACCESS_REMINDER_VIEWED,
    {
      [MixpanelEventParams.LOCATION]: PlanLocation.REMINDER_MODAL,
      [MixpanelEventParams.FREE_ACCESS_DAYS_LEFT]: currentPlan.daysLeft ?? undefined,
    },
    !isLoading,
  )

  return (
    <TrialEndingModalView
      open={!isChanged}
      onClose={onClose}
      daysLeft={currentPlan.daysLeft ?? null}
      periodEndsAt={currentPlan.periodEndsAt}
      isAdmin={isAdmin}
      spaceName={spaceName}
      isLoading={isLoading}
      hasTiers={tiers.length > 0}
      catalog={
        <PlanCatalog
          tiers={tiers}
          currentPlan={currentPlan}
          salesHint={salesHintFor(tiers)}
          onManage={() => void openPortal()}
          onSubscribe={setPick}
          isBusy={isRedirecting}
          readOnly={!isAdmin}
          location={PlanLocation.REMINDER_MODAL}
          onCta={() => trackEvent(SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED, entry)}
        />
      }
      changePlanFlow={
        pick && (
          <ChangePlanFlow
            spaceId={spaceId}
            pick={pick}
            currentPlan={currentPlan}
            entry={entry}
            onClose={() => (isChanged ? onClose() : setPick(undefined))}
            onChanged={() => setIsChanged(true)}
          />
        )
      }
    />
  )
}

/** Mounted on every Workspace page; shows once per login when the trial enters its last week. */
export default function TrialEndingModal({ spaceId }: { spaceId: string }) {
  const { plan, seats, subscription, isTrialing, isTrialEndingSoon, hasPaymentMethod } = useSpacePlan(spaceId)
  const membership = useCurrentMembership(spaceId)
  const isAdmin = useIsAdmin(spaceId)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId }, { skip: !isTrialEndingSoon || isAdmin })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isTrialEndingSoon && !hasPaymentMethod && membership && !wasTrialReminderSeen(spaceId)) setIsOpen(true)
  }, [isTrialEndingSoon, hasPaymentMethod, membership, spaceId])

  if (!isOpen || !plan || !subscription) return null

  const close = () => {
    markTrialReminderSeen(spaceId)
    setIsOpen(false)
  }
  const currentPlan = toCurrentPlan(subscription, plan, isTrialing, seats?.quota)

  return (
    <TrialEndingChooser
      spaceId={spaceId}
      spaceName={space?.name}
      currentPlan={currentPlan}
      seatsQuota={seats?.quota}
      isAdmin={isAdmin}
      onClose={close}
    />
  )
}
