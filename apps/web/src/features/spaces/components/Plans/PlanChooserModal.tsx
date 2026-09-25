import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { formatDate } from '@safe-global/utils/utils/date'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useSeatTrimCheckout } from '../../hooks/billing/useSeatTrimCheckout'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import type { WorkspaceLockReason } from '../../hooks/useWorkspaceLock'
import { ENTERPRISE_TIER, RECOMMENDED_PLAN } from './planCatalog'
import { PlanCatalog } from './PlanCards'
import { InfoTip } from './PlanStatusCard'
import { buildPlanTiers } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import type { PlanPick, PlanTier } from './types'

export const _LAPSED_DATA_NOTE =
  'Nothing was charged. Your paid subscription only starts once you add a payment method. Your Workspace data is kept for 90 days and your Safe accounts stay available in My accounts.'

const maxSeats = (tier: PlanTier): number => Math.max(0, ...tier.options.map((option) => option.seats ?? 0))

/** "Need more than 20?" under the tier with the most seats, pointing to sales. */
export const salesHintFor = (tiers: PlanTier[]) => {
  const largest = tiers.reduce<PlanTier | undefined>(
    (best, tier) => (!best || maxSeats(tier) > maxSeats(best) ? tier : best),
    undefined,
  )
  return (tier: PlanTier) =>
    largest && tier.name === largest.name && maxSeats(tier) > 0 ? `Need more than ${maxSeats(tier)}?` : undefined
}

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
  return endedAt === null
    ? {
        title: 'Your Workspace has no active plan',
        subtitle: 'Choose a plan to keep using your Workspace, everything is exactly as you left it.',
      }
    : {
        title: `Your Safe Pro free access ended on ${formatDate(endedAt)}`,
        subtitle: 'Choose a plan to unlock your Workspace.',
      }
}

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
  const { title, subtitle } = chooserCopy(reason, endedAt)
  const trimming = pick && needsTrim(pick.option.seats) ? pick : undefined

  const subscribe = (picked: PlanPick) => {
    if (!picked.option.paymentLinkId) return
    if (needsTrim(picked.option.seats)) setPick(picked)
    else void checkout(picked.option.paymentLinkId)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && trimming && setPick(undefined)}>
      <DialogContent size="md" surface="card" padding="sm" showCloseButton={Boolean(trimming)}>
        <div className="flex flex-col gap-6 pt-5">
          {trimming ? (
            <SelectAccountsStep
              title="Choose Safe accounts for your plan"
              limit={trimming.option.seats as number}
              planName={trimming.tier.name}
              onBack={() => setPick(undefined)}
              onContinue={(removed) => {
                if (trimming.option.paymentLinkId) void checkout(trimming.option.paymentLinkId, removed)
              }}
              isSubmitting={isBusy}
              error={error}
            />
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <Typography variant="h3" as={DialogTitle}>
                  {highlightSafePro(title)}
                </Typography>
                <div className="flex items-center gap-1.5">
                  <Typography color="muted">{subtitle}</Typography>
                  {reason === 'lapsed' && <InfoTip text={_LAPSED_DATA_NOTE} data-testid="lapsed-data-note" />}
                </div>
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
                  <Skeleton className="h-105 flex-1 rounded-lg-xl" />
                  <Skeleton className="h-105 flex-1 rounded-lg-xl" />
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
                  salesHint={salesHintFor(tiers)}
                  onSubscribe={subscribe}
                  isBusy={isBusy}
                />
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button variant="ghost-muted" size="sm" className="self-center" onClick={onBack}>
                Back to My accounts
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
