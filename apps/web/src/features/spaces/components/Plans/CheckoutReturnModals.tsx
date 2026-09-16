import { useEffect } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useCheckoutReturn } from '../../hooks/billing/useCheckoutReturn'
import { getSubscriptionPeriodEnd, getSubscriptionPlanName } from '../../hooks/billing/subscription'

/** Opens the trial or subscription confirmation once Stripe sends the user back and the subscription has landed. */
export default function CheckoutReturnModals({
  spaceId,
  trialCtaLabel,
  onAddBillingDetails,
}: {
  spaceId?: string | null
  trialCtaLabel?: string
  /** Offers the Stripe portal from the trial confirmation (the onboarding wizard). */
  onAddBillingDetails?: () => void
}) {
  const { SafeProTrialActivatedModal, SafeProSubscriptionActivatedModal } = useLoadFeature(SafeProFeature)
  const { plan, refetch } = useSpacePlan(spaceId)
  const checkout = useCheckoutReturn(spaceId)
  const isComplete = checkout.status === 'complete'

  useEffect(() => {
    if (isComplete) refetch()
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isComplete || !checkout.subscription) return null

  // The fresh subscription knows its own period end; the entitlements it feeds may not have caught up yet.
  const endsAt = getSubscriptionPeriodEnd(checkout.subscription) ?? plan?.periodEndsAt
  const periodEndsAt = endsAt ? Date.parse(endsAt) : 0

  return checkout.subscription.status === 'trialing' ? (
    <SafeProTrialActivatedModal
      open
      onOpenChange={checkout.dismiss}
      trialEndsAt={periodEndsAt}
      ctaLabel={trialCtaLabel}
      onAddBillingDetails={onAddBillingDetails}
    />
  ) : (
    <SafeProSubscriptionActivatedModal
      open
      onOpenChange={checkout.dismiss}
      planName={getSubscriptionPlanName(checkout.subscription) ?? 'Safe Pro'}
    />
  )
}
