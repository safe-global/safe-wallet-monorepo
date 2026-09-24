import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { useBillingPortal } from '../../hooks/billing/useBillingPortal'
import { useSeatTrimCheckout } from '../../hooks/billing/useSeatTrimCheckout'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import type { WorkspaceLockReason } from '../../hooks/useWorkspaceLock'
import { chooserCopy, salesHintFor } from './copy'
import { ENTERPRISE_TIER, RECOMMENDED_PLAN } from './constants'
import { PlanCatalog } from './PlanCards'
import { InfoTip } from './PlanStatusCard'
import { buildPlanTiers } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import type { PlanPick } from './types'

export const LAPSED_DATA_NOTE =
  'Nothing was charged. Your paid subscription only starts once you add a payment method. Your Workspace data is kept for 90 days and your Safe accounts stay available in My accounts.'

/**
 * Blocking plan picker for a Workspace whose trial or plan ended. Before Stripe the admin confirms which Safes the
 * picked plan covers when the Workspace holds more than it allows.
 */
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
  const trimming = pick && needsTrim(pick.option.seats) ? { ...pick, limit: pick.option.seats } : undefined
  const isPaymentFailed = reason === 'payment-failed'
  const hasNoPlans = tiers.length === 0

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
              limit={trimming.limit}
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
                  {reason === 'lapsed' && <InfoTip text={LAPSED_DATA_NOTE} data-testid="lapsed-data-note" />}
                </div>
              </div>

              {isPaymentFailed ? (
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
              ) : hasNoPlans ? (
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
