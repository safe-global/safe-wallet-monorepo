import { useMemo, useState } from 'react'
import { trackEvent } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { MixpanelEventParams, PlanLocation, PlanSelectionEntryPoint } from '@/services/analytics/mixpanel-events'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useSeatTrimCheckout } from '../../hooks/billing/useSeatTrimCheckout'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import type { WorkspaceLockReason } from '../../hooks/useWorkspaceLock'
import { ENTERPRISE_TIER, RECOMMENDED_PLAN } from '@views/features/spaces/components/Plans/planCatalog'
import { PlanCatalog } from './PlanCards'
import { buildPlanTiers, pickProps } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import type { PlanPick } from '@views/features/spaces/components/Plans/types'
import { PlanChooserModalView, salesHintFor } from '@views/features/spaces/components/Plans/PlanChooserModalView'

export {
  _LAPSED_DATA_NOTE,
  chooserCopy,
  salesHintFor,
} from '@views/features/spaces/components/Plans/PlanChooserModalView'

export default function PlanChooserModal({
  spaceId,
  reason,
  endedAt,
  onBack,
}: {
  spaceId: string
  reason: Exclude<WorkspaceLockReason, 'trial-offered'>
  endedAt: number | null
  onBack: () => void
}) {
  const { paidPlans, isLoading } = useSpaceOffers(spaceId)
  const tiers = useMemo(() => buildPlanTiers(paidPlans).filter((tier) => tier.id !== ENTERPRISE_TIER.id), [paidPlans])
  const { needsTrim, checkout, isBusy, error } = useSeatTrimCheckout(spaceId)
  const { openPortal, isRedirecting: isOpeningPortal } = useBillingPortal(spaceId)
  const [pick, setPick] = useState<PlanPick>()
  const trimming = pick && needsTrim(pick.option.seats) ? pick : undefined
  const entry = { [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.LOCKED_MODAL }
  useTrackOnce(SAFE_PRO_EVENTS.WORKSPACE_LOCKED_VIEWED)

  const start = () => trackEvent(SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED, entry)

  const subscribe = (picked: PlanPick) => {
    if (!picked.option.paymentLinkId) return
    if (needsTrim(picked.option.seats)) setPick(picked)
    else void checkout(picked.option.paymentLinkId, { ...pickProps(picked), ...entry })
  }

  return (
    <PlanChooserModalView
      reason={reason}
      endedAt={endedAt}
      accountsStep={
        trimming ? (
          <SelectAccountsStep
            limit={trimming.option.seats as number}
            planName={trimming.tier.name}
            onBack={() => setPick(undefined)}
            onContinue={(removed) => {
              if (trimming.option.paymentLinkId) {
                void checkout(trimming.option.paymentLinkId, { ...pickProps(trimming), ...entry }, removed)
              }
            }}
            isSubmitting={isBusy}
            error={error}
          />
        ) : undefined
      }
      onCancelAccountsStep={() => setPick(undefined)}
      isLoading={isLoading}
      hasTiers={tiers.length > 0}
      catalog={
        <PlanCatalog
          tiers={tiers}
          recommendedPlan={RECOMMENDED_PLAN}
          salesHint={salesHintFor(tiers)}
          onSubscribe={subscribe}
          isBusy={isBusy}
          location={PlanLocation.LOCKED_MODAL}
          onCta={start}
        />
      }
      error={error}
      isOpeningPortal={isOpeningPortal}
      onUpdateBilling={() => void openPortal()}
      onBack={onBack}
      updateBillingTrackingParams={entry}
    />
  )
}
