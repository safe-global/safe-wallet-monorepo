import type { ReactElement, ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { formatDate } from '@safe-global/utils/utils/date'
import Track from '@/components/common/Track'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import type { WorkspaceLockReason } from '@/features/spaces/hooks/useWorkspaceLock'
import { InfoTip } from './PlanStatusCardView'
import type { PlanTier } from './types'

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

export type PlanChooserModalViewProps = {
  reason: Exclude<WorkspaceLockReason, 'trial-offered'>
  endedAt: number | null
  /** Set while the Workspace is trimmed to the picked plan's seats. */
  accountsStep?: ReactNode
  onCancelAccountsStep: () => void
  isLoading: boolean
  hasTiers: boolean
  catalog: ReactNode
  error?: string
  isOpeningPortal: boolean
  onUpdateBilling: () => void
  onBack: () => void
  /** Analytics params of the update billing button. */
  updateBillingTrackingParams: Record<string, unknown>
}

export const PlanChooserModalView = ({
  reason,
  endedAt,
  accountsStep,
  onCancelAccountsStep,
  isLoading,
  hasTiers,
  catalog,
  error,
  isOpeningPortal,
  onUpdateBilling,
  onBack,
  updateBillingTrackingParams,
}: PlanChooserModalViewProps): ReactElement => {
  const { title, subtitle } = chooserCopy(reason, endedAt)
  const isTrimming = Boolean(accountsStep)

  return (
    <Dialog open onOpenChange={(open) => !open && isTrimming && onCancelAccountsStep()}>
      <DialogContent size="md" surface="card" padding="sm" showCloseButton={isTrimming}>
        <div className="flex flex-col gap-6 pt-5">
          {isTrimming ? (
            accountsStep
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
                <Track
                  {...SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED}
                  mixpanelParams={updateBillingTrackingParams}
                  as="div"
                  className="self-start"
                >
                  <Button size="lg" accentIcon disabled={isOpeningPortal} onClick={onUpdateBilling}>
                    Update billing details
                    <ArrowRight />
                  </Button>
                </Track>
              ) : isLoading ? (
                <div className="flex gap-4" data-testid="plan-chooser-skeleton">
                  <Skeleton className="h-105 flex-1 rounded-lg-xl" />
                  <Skeleton className="h-105 flex-1 rounded-lg-xl" />
                </div>
              ) : !hasTiers ? (
                <Alert variant="info">
                  <AlertSeverityIcon variant="info" />
                  <AlertDescription>There is no plan available for this Workspace right now.</AlertDescription>
                </Alert>
              ) : (
                catalog
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
