import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import {
  SafeProNoticeModal,
  SafeProPendingModal,
  SafeProSubscriptionActivatedModal,
  SafeProTrialActivatedModal,
} from '../SafeProModals'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useCheckoutReturn, type CheckoutReturnStatus } from '../../hooks/billing/useCheckoutReturn'
import { getSubscriptionPeriodEnd, getSubscriptionPlanName } from '../../hooks/billing/subscription'
import { seatsLabel } from './planTiers'

const PENDING_STATUSES: CheckoutReturnStatus[] = ['processing', 'activating']

const FAILURE_COPY = {
  timeout: {
    title: 'Your subscription is taking longer than expected',
    body: 'Stripe accepted the checkout, but your Workspace hasn’t been updated yet. Try again in a moment; if the problem persists, contact support.',
  },
  error: {
    title: 'We couldn’t confirm your checkout',
    body: 'We couldn’t verify the checkout session. If you were charged, contact support and we’ll sort it out.',
  },
} as const

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

  if (PENDING_STATUSES.includes(checkout.status)) {
    return <SafeProPendingModal title="Confirming your subscription" body="This usually takes a few seconds." />
  }

  if (checkout.status === 'timeout' || checkout.status === 'error') {
    const { title, body } = FAILURE_COPY[checkout.status]
    return (
      <SafeProNoticeModal
        open
        title={title}
        body={body}
        actionLabel="Close"
        onAction={leave}
        secondaryActionLabel={checkout.status === 'timeout' ? 'Try again' : undefined}
        onSecondaryAction={checkout.status === 'timeout' ? checkout.retry : undefined}
        onOpenChange={(open) => !open && leave()}
      />
    )
  }

  if (!isComplete || !checkout.subscription) return null

  // The fresh subscription knows its own period end; the entitlements it feeds may not have caught up yet.
  const endsAt = getSubscriptionPeriodEnd(checkout.subscription) ?? plan?.periodEndsAt
  const parsedEndsAt = endsAt ? Date.parse(endsAt) : Number.NaN
  const trialEndsAt = Number.isFinite(parsedEndsAt) ? parsedEndsAt : null

  return checkout.subscription.status === 'trialing' ? (
    <SafeProTrialActivatedModal
      open
      onOpenChange={checkout.dismiss}
      trialEndsAt={trialEndsAt}
      ctaLabel={trialCtaLabel}
      hasPaymentMethod={checkout.subscription.hasPaymentMethod === true}
    />
  ) : (
    <SafeProSubscriptionActivatedModal
      open
      onOpenChange={checkout.dismiss}
      planName={getSubscriptionPlanName(checkout.subscription) ?? 'Safe Pro'}
      seatsLabel={typeof seats?.quota === 'number' ? seatsLabel(seats.quota) : undefined}
    />
  )
}
