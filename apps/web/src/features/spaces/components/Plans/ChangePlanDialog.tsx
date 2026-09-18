import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import DialogActions from '@/components/common/DialogActions'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { isElevationRequiredError } from '@/features/oidc-auth'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { formatDate } from '@safe-global/utils/utils/date'
import { useChangePlan } from '../../hooks/billing/useChangePlan'
import { useSeatTrim } from '../../hooks/billing/useSeatTrim'
import { formatPlanPrice, getChangeDirection, priceSuffix } from './planTiers'
import type { CurrentPlan, PlanPick, SafeRef } from './types'

/** Stripe amounts arrive in minor units and its dates in seconds. */
const money = (minorUnits: number, currency: string) => formatCurrency(minorUnits / 100, currency.toUpperCase())

const LABELS = {
  upgrade: { title: 'Upgrade plan', confirm: 'Confirm upgrade', note: 'Your plan will be upgraded immediately.' },
  downgrade: {
    title: 'Downgrade plan',
    confirm: 'Confirm downgrade',
    note: 'Your plan will be downgraded immediately.',
  },
  change: { title: 'Change plan', confirm: 'Confirm change', note: 'Your plan will change immediately.' },
} as const

const PlanColumn = ({ label, name, price }: { label: string; name: string; price: string }) => (
  <div className="flex flex-col items-center gap-0.5">
    <Typography variant="paragraph-small" color="muted">
      {label}
    </Typography>
    <Typography variant="paragraph-large-medium">{name}</Typography>
    <Typography variant="paragraph-small" color="muted">
      {price}
    </Typography>
  </div>
)

export default function ChangePlanDialog({
  spaceId,
  pick,
  currentPlan,
  removed = [],
  onClose,
  onChanged,
}: {
  spaceId: string
  pick: PlanPick
  currentPlan: CurrentPlan
  /** Safes the accounts step left out; they leave the Workspace right before the plan changes. */
  removed?: SafeRef[]
  onClose: () => void
  /** Fires only after the plan changed, before `onClose`, for a parent that should close along with the dialog. */
  onChanged?: () => void
}) {
  const dispatch = useAppDispatch()
  const { previewChange, preview, isPreviewing, previewError, changePlan, isChanging, changeError } =
    useChangePlan(spaceId)
  const { trim, isTrimming, error: trimError } = useSeatTrim(spaceId)
  const [isVerifying, setIsVerifying] = useState(false)
  const { priceId, paymentLinkId } = pick.option
  const direction = getChangeDirection(currentPlan, pick)
  const labels = LABELS[direction]
  // A trial has no invoice to prorate against (Stripe rejects the preview without a payment method), and nothing is
  // charged until it ends, so the switch is explained instead of previewed.
  const isTrialSwitch = currentPlan.isTrialing

  useEffect(() => {
    if (priceId && !isTrialSwitch) previewChange(priceId)
  }, [priceId, isTrialSwitch, previewChange])

  // The step-up redirect is on its way; the rejection must not read as a failure.
  useEffect(() => {
    if (isElevationRequiredError(changeError)) setIsVerifying(true)
  }, [changeError])

  const onConfirm = async () => {
    if (!priceId || !paymentLinkId) return
    if (!(await trim(removed))) return
    const ok = await changePlan(priceId, paymentLinkId)
    if (!ok) return
    dispatch(
      showNotification({
        message: `Plan ${direction === 'change' ? 'changed' : `${direction}d`} to ${pick.tier.name}.`,
        variant: 'success',
        groupKey: 'plan-updated',
      }),
    )
    onChanged?.()
    onClose()
  }

  const error = previewError ?? (isVerifying ? undefined : changeError)
  const errorMessage =
    trimError ?? (error ? getRtkQueryErrorMessage(error) || 'Something went wrong. Please try again.' : undefined)
  const isBusy = isTrimming || isChanging || isVerifying

  return (
    <AlertDialog open onOpenChange={(open) => !open && !isBusy && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.title}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex items-center justify-center gap-6" data-testid="change-plan-summary">
          <PlanColumn
            label="Current plan"
            name={currentPlan.name}
            price={`${formatPlanPrice(currentPlan.price, currentPlan.currency)} ${priceSuffix(currentPlan.billingCycle)}`}
          />
          <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
          <PlanColumn
            label="New plan"
            name={pick.tier.name}
            price={`${pick.option.price === null ? 'Custom' : formatPlanPrice(pick.option.price, pick.tier.currency)} ${priceSuffix(pick.tier.billingCycle)} · ${pick.option.label}`}
          />
        </div>

        {isTrialSwitch ? (
          <Typography color="muted" data-testid="change-plan-trial-note">
            You&apos;re on a free trial
            {currentPlan.periodEndsAt ? ` until ${formatDate(Date.parse(currentPlan.periodEndsAt))}` : ''}. Nothing is
            charged now. From then on you&apos;ll pay{' '}
            {pick.option.price === null ? 'a custom price' : formatPlanPrice(pick.option.price, pick.tier.currency)}
            {priceSuffix(pick.tier.billingCycle)} for {pick.tier.name}.
          </Typography>
        ) : isPreviewing || (!preview && !previewError) ? (
          <div className="flex flex-col gap-2" data-testid="change-plan-skeleton">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ) : preview ? (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <Typography variant="paragraph-medium">Proration details</Typography>
            <ul className="flex flex-col gap-1.5">
              {preview.lineItems.map((item, index) => (
                <li key={`${item.description}-${index}`} className="flex items-baseline justify-between gap-4">
                  <Typography variant="paragraph-small" color="muted">
                    {item.description}
                  </Typography>
                  <Typography variant="paragraph-small" className="whitespace-nowrap tabular-nums">
                    {money(item.amount, item.currency)}
                  </Typography>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
              <Typography variant="paragraph-medium">Amount due on next invoice</Typography>
              <Typography variant="paragraph-bold" className="tabular-nums" data-testid="change-plan-amount-due">
                {money(preview.amountDue, preview.currency)}
              </Typography>
            </div>
            <Typography variant="paragraph-small" color="muted">
              Next billing date: {formatDate(preview.nextBillingDate * 1000)}
            </Typography>
            <Typography variant="paragraph-small" color="muted">
              {labels.note}
            </Typography>
          </div>
        ) : null}

        {removed.length > 0 && (
          <Typography variant="paragraph-small" color="muted" data-testid="change-plan-removed-note">
            {removed.length === 1 ? '1 Safe account' : `${removed.length} Safe accounts`} will be removed from the
            Workspace. They remain available in My accounts.
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

        <AlertDialogFooter>
          <DialogActions
            onCancel={onClose}
            cancelDisabled={isBusy}
            confirmLabel={labels.confirm}
            onConfirm={() => void onConfirm()}
            confirmLoading={isBusy}
            confirmDisabled={!priceId || !paymentLinkId || (!isTrialSwitch && (!preview || Boolean(previewError)))}
            confirmTestId="change-plan-confirm"
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
