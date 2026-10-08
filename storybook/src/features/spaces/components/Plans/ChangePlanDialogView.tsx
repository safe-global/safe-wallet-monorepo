import type { ReactElement } from 'react'
import { ArrowRight } from 'lucide-react'
import type { SubscriptionUpdatePreview } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { formatDate } from '@safe-global/utils/utils/date'
import { removedSafesNote, type RemovedSafesSummary } from './removedSafes'
import { formatPlanPrice, priceSuffix } from './planPrice'
import type { CurrentPlan, PlanChangeDirection, PlanPick } from './types'

/** Stripe amounts arrive in minor units and its dates in seconds. */
const money = (minorUnits: number, currency: string) => formatCurrency(minorUnits / 100, currency.toUpperCase())

const NOTES = {
  upgrade: 'Your plan will be upgraded immediately',
  downgrade: 'Your plan will be downgraded immediately',
  change: 'Your plan will change immediately',
} as const

/** The change is titled by what the Workspace ends up with: its seats, whichever plan they come from. */
export const changeTitle = (direction: PlanChangeDirection, seats: string): string =>
  direction === 'upgrade' ? `Upgrade to ${seats}` : `Switch to ${seats}`

const PlanColumn = ({ label, name, seats, price }: { label: string; name: string; seats?: string; price: string }) => (
  <div className="flex flex-col items-center gap-1">
    <Typography variant="paragraph-small" color="muted">
      {label}
    </Typography>
    <div className="flex items-baseline gap-1">
      <Typography variant="paragraph-large-medium">{name}</Typography>
      {seats && <Typography color="muted">· {seats}</Typography>}
    </div>
    <Typography variant="paragraph-large">{price}</Typography>
  </div>
)

export type ChangePlanDialogViewProps = {
  pick: PlanPick
  currentPlan: CurrentPlan
  direction: PlanChangeDirection
  isTrialSwitch: boolean
  preview?: SubscriptionUpdatePreview
  isPreviewing: boolean
  hasPreviewError: boolean
  /** Set when the preview or the change failed; an empty message falls back to a generic one. */
  error?: { message: string }
  removedSummary: RemovedSafesSummary
  isVerifying: boolean
  isBusy: boolean
  canConfirm: boolean
  onClose: () => void
  onConfirm: () => void
}

export const ChangePlanDialogView = ({
  pick,
  currentPlan,
  direction,
  isTrialSwitch,
  preview,
  isPreviewing,
  hasPreviewError,
  error,
  removedSummary,
  isVerifying,
  isBusy,
  canConfirm,
  onClose,
  onConfirm,
}: ChangePlanDialogViewProps): ReactElement => {
  const title = changeTitle(direction, pick.option.label)
  const note = NOTES[direction]
  const errorMessage = error ? error.message || 'Something went wrong. Please try again.' : undefined
  const removedNote = removedSafesNote(removedSummary)

  return (
    <Dialog open onOpenChange={(open) => !open && !isBusy && onClose()}>
      <DialogContent size="sm" surface="card" padding="sm">
        <div className="flex flex-col gap-4 pt-5">
          <Typography variant="h3" as={DialogTitle}>
            {title}
          </Typography>

          <div className="flex items-center justify-center gap-8 py-4" data-testid="change-plan-summary">
            <PlanColumn
              label="Current plan"
              name={currentPlan.name}
              seats={currentPlan.seatsLabel}
              price={`${formatPlanPrice(currentPlan.price, currentPlan.currency)}${priceSuffix(currentPlan.billingCycle)}`}
            />
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            <PlanColumn
              label="New plan"
              name={pick.tier.name}
              seats={pick.option.label}
              price={`${pick.option.price === null ? 'Custom' : formatPlanPrice(pick.option.price, pick.tier.currency)}${priceSuffix(pick.tier.billingCycle)}`}
            />
          </div>

          <Separator />

          {isTrialSwitch ? (
            <Typography color="muted" data-testid="change-plan-trial-note">
              You&apos;re on free access
              {currentPlan.periodEndsAt ? ` until ${formatDate(Date.parse(currentPlan.periodEndsAt))}` : ''}. Nothing is
              charged now. From then on you&apos;ll pay{' '}
              {pick.option.price === null ? 'a custom price' : formatPlanPrice(pick.option.price, pick.tier.currency)}
              {priceSuffix(pick.tier.billingCycle)} for {pick.tier.name}.
            </Typography>
          ) : isPreviewing || (!preview && !hasPreviewError) ? (
            <div className="flex flex-col gap-2" data-testid="change-plan-skeleton">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : preview ? (
            <>
              <div className="flex flex-col gap-3">
                <Typography variant="paragraph-large-medium">Proration details</Typography>
                <ul className="flex flex-col gap-2">
                  {preview.lineItems.map((item, index) => (
                    <li key={`${item.description}-${index}`} className="flex items-baseline justify-between gap-4">
                      <Typography color="muted">{item.description}</Typography>
                      <Typography color="muted" className="whitespace-nowrap tabular-nums">
                        {money(item.amount, item.currency)}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <Typography variant="paragraph-large-medium">Amount due on next invoice</Typography>
                  <Typography
                    variant="paragraph-large-medium"
                    className="tabular-nums"
                    data-testid="change-plan-amount-due"
                  >
                    {money(preview.amountDue, preview.currency)}
                  </Typography>
                </div>
                <Typography color="muted">Next billing date: {formatDate(preview.nextBillingDate * 1000)}</Typography>
                <Typography>{note}</Typography>
              </div>
            </>
          ) : null}

          {removedNote && (
            <Typography color="muted" data-testid="change-plan-removed-note">
              {removedNote}
            </Typography>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertSeverityIcon variant="destructive" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {isVerifying && (
            <Alert variant="info">
              <AlertSeverityIcon variant="info" />
              <AlertDescription>
                Verify your identity to confirm the plan change. You will be redirected.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 pt-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={onClose} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              size="lg"
              accentIcon
              className="flex-1"
              disabled={!canConfirm || isBusy}
              onClick={onConfirm}
              data-testid="change-plan-confirm"
            >
              {isBusy ? (
                <Spinner />
              ) : (
                <>
                  Confirm change
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
