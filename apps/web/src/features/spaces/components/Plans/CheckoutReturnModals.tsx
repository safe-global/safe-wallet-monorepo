import { useEffect } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useCheckoutReturn } from '../../hooks/billing/useCheckoutReturn'

/** Opens the trial or subscription confirmation once Stripe sends the user back and the subscription has landed. */
export default function CheckoutReturnModals({
  spaceId,
  trialCtaLabel,
}: {
  spaceId?: string | null
  trialCtaLabel?: string
}) {
  const { SafeProTrialActivatedModal, SafeProSubscriptionActivatedModal } = useLoadFeature(SafeProFeature)
  const { plan, refetch } = useSpacePlan(spaceId)
  const checkout = useCheckoutReturn(spaceId)
  const isComplete = checkout.status === 'complete'

  useEffect(() => {
    if (isComplete) refetch()
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isComplete || !checkout.subscription) return null

  const periodEndsAt = plan?.periodEndsAt ? Date.parse(plan.periodEndsAt) : 0

  return checkout.subscription.status === 'trialing' ? (
    <SafeProTrialActivatedModal
      open
      onOpenChange={checkout.dismiss}
      trialEndsAt={periodEndsAt}
      ctaLabel={trialCtaLabel}
    />
  ) : (
    <SafeProSubscriptionActivatedModal
      open
      onOpenChange={checkout.dismiss}
      planName={checkout.subscription.plan.name ?? 'Safe Pro'}
      price={checkout.subscription.plan.currentPrice}
      currency={checkout.subscription.plan.currency}
      nextBillingAt={periodEndsAt}
    />
  )
}
