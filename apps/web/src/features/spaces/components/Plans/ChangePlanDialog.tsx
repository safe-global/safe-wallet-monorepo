import { useEffect, useState } from 'react'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { isElevationRequiredError } from '@/features/oidc-auth'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { flattenSafeItems } from '@/hooks/safes'
import { useChangePlan } from '../../hooks/billing/useChangePlan'
import { useSpaceSafes } from '../../hooks/useSpaceSafes'
import { summarizeRemovedSafes } from '@views/features/spaces/components/Plans/removedSafes'
import { getChangeDirection } from './planTiers'
import type { CurrentPlan, PlanPick, SafeRef } from '@views/features/spaces/components/Plans/types'
import { ChangePlanDialogView } from '@views/features/spaces/components/Plans/ChangePlanDialogView'

export { changeTitle } from '@views/features/spaces/components/Plans/ChangePlanDialogView'

export default function ChangePlanDialog({
  spaceId,
  pick,
  currentPlan,
  entry,
  removed = [],
  onClose,
  onChanged,
}: {
  spaceId: string
  pick: PlanPick
  currentPlan: CurrentPlan
  /** Analytics: where plan selection started. */
  entry: Record<string, unknown>
  /** Safes the accounts step left out; the plan change removes them from the Workspace first. */
  removed?: SafeRef[]
  /** Dismissed without changing anything. */
  onClose: () => void
  /** The plan changed; the parent takes it from here (this dialog does not close itself). */
  onChanged: () => void
}) {
  const { previewChange, preview, isPreviewing, previewError, changePlan, isChanging, changeError } =
    useChangePlan(spaceId)
  const [isVerifying, setIsVerifying] = useState(false)
  const { priceId, paymentLinkId } = pick.option
  const direction = getChangeDirection(currentPlan, pick)
  // Stripe rejects a proration preview for a trial without a payment method, so the switch is explained instead.
  const isTrialSwitch = currentPlan.isTrialing

  useEffect(() => {
    if (priceId && !isTrialSwitch) previewChange(priceId)
  }, [priceId, isTrialSwitch, previewChange])

  // The step-up redirect is on its way; the rejection must not read as a failure.
  useEffect(() => {
    if (isElevationRequiredError(changeError)) setIsVerifying(true)
  }, [changeError])

  const changeProps = {
    [MixpanelEventParams.FROM_PLAN]: currentPlan.name.toLowerCase(),
    [MixpanelEventParams.TO_PLAN]: pick.tier.name.toLowerCase(),
    [MixpanelEventParams.FROM_SEATS]: currentPlan.seats,
    [MixpanelEventParams.TO_SEATS]: pick.option.seats ?? undefined,
    [MixpanelEventParams.AMOUNT_DUE]: preview ? preview.amountDue / 100 : undefined,
  }
  const onConfirm = async () => {
    if (!priceId || !paymentLinkId) return
    if (await changePlan(priceId, paymentLinkId, removed)) {
      trackEvent(SAFE_PRO_EVENTS.PLAN_CHANGE_CONFIRMED, { ...changeProps, ...entry })
      onChanged()
    }
  }

  const error = previewError ?? (isVerifying ? undefined : changeError)
  const isBusy = isChanging || isVerifying
  const canConfirm = Boolean(priceId && paymentLinkId) && (isTrialSwitch || (Boolean(preview) && !previewError))
  const { allSafes } = useSpaceSafes()

  return (
    <ChangePlanDialogView
      pick={pick}
      currentPlan={currentPlan}
      direction={direction}
      isTrialSwitch={isTrialSwitch}
      preview={preview}
      isPreviewing={isPreviewing}
      hasPreviewError={Boolean(previewError)}
      error={error ? { message: getRtkQueryErrorMessage(error) } : undefined}
      removedSummary={summarizeRemovedSafes(flattenSafeItems(allSafes), removed)}
      isVerifying={isVerifying}
      isBusy={isBusy}
      canConfirm={canConfirm}
      onClose={onClose}
      onConfirm={() => void onConfirm()}
    />
  )
}
