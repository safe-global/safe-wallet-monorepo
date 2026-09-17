import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useCheckoutReturn, type CheckoutReturnStatus } from '../../hooks/billing/useCheckoutReturn'
import { getSubscriptionPeriodEnd, getSubscriptionPlanName } from '../../hooks/billing/subscription'

const PENDING_STATUSES: CheckoutReturnStatus[] = ['processing', 'activating']

const CheckoutPendingDialog = () => (
  <Dialog open onOpenChange={() => undefined}>
    <DialogContent size="xs" surface="card" padding="md" showCloseButton={false}>
      <div className="flex flex-col items-center gap-4 py-4 text-center" data-testid="checkout-pending">
        <Spinner className="size-8" />
        <div className="flex flex-col gap-1">
          <Typography variant="h4" as={DialogTitle}>
            Confirming your subscription
          </Typography>
          <Typography color="muted">This usually takes a few seconds.</Typography>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

const CheckoutFailedDialog = ({
  status,
  onRetry,
  onClose,
}: {
  status: 'timeout' | 'error'
  onRetry: () => void
  onClose: () => void
}) => (
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent size="xs" surface="card" padding="md" showCloseButton={false}>
      <div className="flex flex-col gap-6" data-testid="checkout-failed">
        <div className="flex flex-col gap-2">
          <Typography variant="h4" as={DialogTitle}>
            {status === 'timeout'
              ? 'Your subscription is taking longer than expected'
              : 'We couldn’t confirm your checkout'}
          </Typography>
          <Typography color="muted">
            {status === 'timeout'
              ? 'Stripe accepted the checkout, but your Workspace hasn’t been updated yet. Try again in a moment; if the problem persists, contact support.'
              : 'We couldn’t verify the checkout session. If you were charged, contact support and we’ll sort it out.'}
          </Typography>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {status === 'timeout' && (
            <Button size="lg" className="flex-1" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

/**
 * Owns the screen while Stripe sends the user back: a blocking loader until the session settles and the subscription
 * lands, then the trial or subscription confirmation, or an error when the session fails or never propagates.
 */
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

  if (PENDING_STATUSES.includes(checkout.status)) return <CheckoutPendingDialog />

  if (checkout.status === 'timeout' || checkout.status === 'error') {
    return <CheckoutFailedDialog status={checkout.status} onRetry={checkout.retry} onClose={checkout.dismiss} />
  }

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
