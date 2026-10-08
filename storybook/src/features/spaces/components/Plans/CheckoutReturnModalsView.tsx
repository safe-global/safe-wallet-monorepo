import type { ReactElement } from 'react'
import type { CheckoutReturnStatus } from '@/features/spaces/hooks/billing/useCheckoutReturn'
import {
  SafeProNoticeModal,
  SafeProPendingModal,
  SafeProSubscriptionActivatedModal,
  SafeProTrialActivatedModal,
} from '../SafeProModals'
import { seatsLabel } from './planPrice'

const PENDING_STATUSES: CheckoutReturnStatus[] = ['processing', 'activating']

const FAILURE_COPY = {
  timeout: {
    title: 'Your subscription is taking longer than expected',
    body: 'We haven’t been able to confirm your subscription yet. Try again in a moment; if the problem persists, contact support.',
  },
  error: {
    title: 'We couldn’t confirm your checkout',
    body: 'We couldn’t verify the checkout session. If you were charged, contact support and we’ll sort it out.',
  },
} as const

export type CheckoutReturnModalsViewProps = {
  status: CheckoutReturnStatus
  /** The confirmed subscription, once the checkout is complete. */
  subscription?: { isTrialing: boolean; hasPaymentMethod: boolean; planName?: string }
  trialEndsAt: number | null
  seatsQuota?: number
  trialCtaLabel?: string
  onLeave: () => void
  onRetry: () => void
  onDismiss: () => void
}

export const CheckoutReturnModalsView = ({
  status,
  subscription,
  trialEndsAt,
  seatsQuota,
  trialCtaLabel,
  onLeave,
  onRetry,
  onDismiss,
}: CheckoutReturnModalsViewProps): ReactElement | null => {
  if (PENDING_STATUSES.includes(status)) {
    return <SafeProPendingModal title="Confirming your subscription" body="This usually takes a few seconds." />
  }

  if (status === 'timeout' || status === 'error') {
    const { title, body } = FAILURE_COPY[status]
    return (
      <SafeProNoticeModal
        open
        title={title}
        body={body}
        actionLabel="Close"
        onAction={onLeave}
        secondaryActionLabel={status === 'timeout' ? 'Try again' : undefined}
        onSecondaryAction={status === 'timeout' ? onRetry : undefined}
        onOpenChange={(open) => !open && onLeave()}
      />
    )
  }

  if (status !== 'complete' || !subscription) return null

  return subscription.isTrialing ? (
    <SafeProTrialActivatedModal
      open
      onOpenChange={onDismiss}
      trialEndsAt={trialEndsAt}
      ctaLabel={trialCtaLabel}
      hasPaymentMethod={subscription.hasPaymentMethod}
    />
  ) : (
    <SafeProSubscriptionActivatedModal
      open
      onOpenChange={onDismiss}
      planName={subscription.planName ?? 'Safe Pro'}
      seatsLabel={typeof seatsQuota === 'number' ? seatsLabel(seatsQuota) : undefined}
    />
  )
}
