import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useCheckoutReturn } from '../../hooks/billing/useCheckoutReturn'
import { getSubscriptionPeriodEnd, getSubscriptionPlanName } from '../../hooks/billing/subscription'
import { CheckoutReturnModalsView } from '@views/features/spaces/components/Plans/CheckoutReturnModalsView'

export default function CheckoutReturnModals({
  spaceId,
  trialCtaLabel,
}: {
  spaceId?: string | null
  trialCtaLabel?: string
}) {
  const { plan, seats, refetch } = useSpacePlan(spaceId)
  const checkout = useCheckoutReturn(spaceId)
  const router = useRouter()
  const isComplete = checkout.status === 'complete'
  // A failed return leaves the Workspace as it was, so closing steps out to the Workspaces list.
  const leave = () => void router.push(AppRoutes.welcome.spaces)

  useEffect(() => {
    if (isComplete) refetch()
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps -- refetch is a new function every render

  const { subscription } = checkout
  // The fresh subscription knows its own period end; the entitlements it feeds may not have caught up yet.
  const endsAt = getSubscriptionPeriodEnd(subscription) ?? plan?.periodEndsAt
  const parsedEndsAt = endsAt ? Date.parse(endsAt) : Number.NaN

  return (
    <CheckoutReturnModalsView
      status={checkout.status}
      subscription={
        subscription
          ? {
              isTrialing: subscription.status === 'trialing',
              hasPaymentMethod: subscription.hasPaymentMethod === true,
              planName: getSubscriptionPlanName(subscription) ?? undefined,
            }
          : undefined
      }
      trialEndsAt={Number.isFinite(parsedEndsAt) ? parsedEndsAt : null}
      seatsQuota={typeof seats?.quota === 'number' ? seats.quota : undefined}
      trialCtaLabel={trialCtaLabel}
      onLeave={leave}
      onRetry={checkout.retry}
      onDismiss={checkout.dismiss}
    />
  )
}
