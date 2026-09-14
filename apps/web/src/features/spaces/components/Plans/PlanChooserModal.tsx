import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useStartCheckout } from '../../hooks/billing/useStartCheckout'
import type { WorkspaceLockReason } from '../../hooks/useWorkspaceLock'
import { ENTERPRISE_TIER, RECOMMENDED_PLAN } from './fixtures'
import { PlanCatalog } from './PlanCards'
import { buildPlanTiers } from './planTiers'
import type { PlanTier } from './types'

const maxSeats = (tier: PlanTier): number => Math.max(0, ...tier.options.map((option) => option.seats ?? 0))

export const chooserCopy = (
  reason: Exclude<WorkspaceLockReason, 'trial-offered'>,
  endedAt: number | null,
): { title: string; subtitle: string } => {
  if (reason === 'payment-failed') {
    return {
      title: 'Your last payment failed',
      subtitle: 'Update your billing details to keep using your Workspace, everything is exactly as you left it.',
    }
  }
  return {
    title: endedAt === null ? 'Your Workspace has no active plan' : `Your free trial ended on ${formatDate(endedAt)}`,
    subtitle: 'Choose a plan to keep using your Workspace, everything is exactly as you left it.',
  }
}

/** Blocking plan picker for a Workspace whose trial or plan ended; on the Plans page it can be dismissed. */
export default function PlanChooserModal({
  spaceId,
  reason,
  endedAt,
  onBack,
  onDismiss,
}: {
  spaceId: string
  reason: Exclude<WorkspaceLockReason, 'trial-offered'>
  endedAt: number | null
  onBack: () => void
  onDismiss?: () => void
}) {
  const { paidPlans, isLoading } = useSpaceOffers(spaceId)
  const tiers = useMemo(() => buildPlanTiers(paidPlans).filter((tier) => tier.id !== ENTERPRISE_TIER.id), [paidPlans])
  const { startCheckout, isRedirecting, isError: isCheckoutError } = useStartCheckout(spaceId)
  const { openPortal, isRedirecting: isOpeningPortal } = useBillingPortal(spaceId)
  const largest = tiers.reduce<PlanTier | undefined>(
    (best, tier) => (!best || maxSeats(tier) > maxSeats(best) ? tier : best),
    undefined,
  )
  const { title, subtitle } = chooserCopy(reason, endedAt)

  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss?.()}>
      <DialogContent size="md" surface="card" padding="sm" showCloseButton={Boolean(onDismiss)}>
        <div className="flex flex-col gap-6 pt-5">
          <div className="flex flex-col gap-1">
            <Typography variant="h3" as={DialogTitle}>
              {title}
            </Typography>
            <Typography color="muted">{subtitle}</Typography>
          </div>

          {reason === 'payment-failed' ? (
            <Button
              size="lg"
              accentIcon
              className="self-start"
              disabled={isOpeningPortal}
              onClick={() => void openPortal()}
            >
              Update billing details
              <ArrowRight />
            </Button>
          ) : isLoading ? (
            <div className="flex gap-4" data-testid="plan-chooser-skeleton">
              <Skeleton className="h-[420px] flex-1 rounded-lg-xl" />
              <Skeleton className="h-[420px] flex-1 rounded-lg-xl" />
            </div>
          ) : tiers.length === 0 ? (
            <Alert variant="info">
              <AlertSeverityIcon variant="info" />
              <AlertDescription>There is no plan available for this Workspace right now.</AlertDescription>
            </Alert>
          ) : (
            <PlanCatalog
              tiers={tiers}
              recommendedPlan={RECOMMENDED_PLAN}
              salesHint={(tier) =>
                largest && tier.name === largest.name && maxSeats(tier) > 0
                  ? `Need more than ${maxSeats(tier)}?`
                  : undefined
              }
              onSubscribe={(pick) => pick.option.paymentLinkId && void startCheckout(pick.option.paymentLinkId)}
              isBusy={isRedirecting}
            />
          )}

          {isCheckoutError && (
            <Alert variant="destructive">
              <AlertSeverityIcon variant="destructive" />
              <AlertDescription>We couldn’t start the checkout. Please try again.</AlertDescription>
            </Alert>
          )}

          <Button variant="ghost-muted" size="sm" className="self-center" onClick={onBack}>
            Back to My accounts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
