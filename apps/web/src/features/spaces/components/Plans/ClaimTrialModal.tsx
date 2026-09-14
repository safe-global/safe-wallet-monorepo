import { useMemo, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import {
  useSpaceSafesDeleteV1Mutation,
  useSpaceSafesGetV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { formatDate } from '@safe-global/utils/utils/date'
import { DAY_MS } from '../../hooks/billing/subscription'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useStartCheckout } from '../../hooks/billing/useStartCheckout'
import { RECOMMENDED_PLAN } from './fixtures'
import { claimTiers, formatPlanPrice, priceSuffix } from './planTiers'
import SelectAccountsStep, { type SafeRef } from './SelectAccountsStep'
import type { PlanTier } from './types'

// The CGW grants the 60-day grace only to Workspaces that predate enforcement; anything else is a new Workspace.
const MIGRATED_TRIAL_DAYS = 60

export type ClaimTrialLabels = { back: string; claim: string }
const LOCKED_LABELS: ClaimTrialLabels = { back: 'Back to My accounts', claim: 'Claim free trial' }

export const claimCopy = (trialPeriodDays: number | null): { title: string; subtitle: string } =>
  trialPeriodDays === MIGRATED_TRIAL_DAYS
    ? {
        title: 'Your Workspace moved to Safe Pro on Oct 6, 2026',
        subtitle: 'You’ve used Safe before, so your trial is 60 days instead of 30.',
      }
    : {
        title:
          trialPeriodDays === null
            ? 'Start your free trial of Safe Pro'
            : `Start your ${trialPeriodDays}-day free trial of Safe Pro`,
        subtitle: 'All Pro features unlocked. No billing details needed upfront.',
      }

const TrialOfferCard = ({
  tier,
  availableUntil,
  selectable,
  selected,
  onSelect,
}: {
  tier: PlanTier
  availableUntil: string | null
  selectable: boolean
  selected: boolean
  onSelect: () => void
}) => {
  const option = tier.options[0]

  return (
    <Card
      variant="muted-secondary"
      radius="lg-xl"
      className={cn('flex-1', selectable && 'cursor-pointer')}
      selected={selectable ? selected : undefined}
      role={selectable ? 'radio' : undefined}
      aria-checked={selectable ? selected : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={selectable ? onSelect : undefined}
      onKeyDown={selectable ? (e) => (e.key === 'Enter' || e.key === ' ') && onSelect() : undefined}
      data-testid={`trial-offer-${tier.name}`}
    >
      <CardContent className="flex flex-col">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="paragraph-large-medium">{tier.name}</Typography>
            <div className="flex items-baseline gap-1">
              <Typography variant="h4" className="line-through">
                {option.price === null ? 'Custom' : formatPlanPrice(option.price, tier.currency)}
              </Typography>
              <Typography color="muted">{priceSuffix(tier.billingCycle)}</Typography>
              <Typography variant="paragraph-large-bold" color="success">
                Free
              </Typography>
            </div>
            {availableUntil && (
              <Typography variant="paragraph-small" color="muted">
                Available until {availableUntil}
              </Typography>
            )}
          </div>

          <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <Typography variant="paragraph-small">{feature}</Typography>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Blocking offer of the Workspace's free trial. When the Workspace holds more Safes than the offer covers, a second
 * step trims it before Stripe: the Safes left out are removed from the Workspace, not from the user's accounts.
 */
export default function ClaimTrialModal({
  spaceId,
  onBack,
  returnPathname,
  labels = LOCKED_LABELS,
}: {
  spaceId: string
  onBack: () => void
  /** Where Stripe sends the user back; defaults to the Workspace Home. */
  returnPathname?: string
  labels?: ClaimTrialLabels
}) {
  const { trialPlans, trialPeriodDays, isLoading } = useSpaceOffers(spaceId)
  const tiers = useMemo(() => claimTiers(trialPlans), [trialPlans])
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query({ spaceId })
  const safeCount = useMemo(
    () => Object.values(spaceSafes?.safes ?? {}).reduce((total, addresses) => total + addresses.length, 0),
    [spaceSafes],
  )
  const { startCheckout, isRedirecting, isError: isCheckoutError } = useStartCheckout(spaceId, returnPathname)
  const [removeSafes, { isLoading: isRemoving, error: removeError }] = useSpaceSafesDeleteV1Mutation()
  const [pickedTierId, setPickedTierId] = useState<string>()
  const [step, setStep] = useState<'offer' | 'accounts'>('offer')

  const tier =
    tiers.find((candidate) => candidate.id === pickedTierId) ??
    tiers.find((candidate) => candidate.name === RECOMMENDED_PLAN) ??
    tiers[0]
  const option = tier?.options[0]
  const seats = option?.seats ?? null
  const needsAccountsStep = seats !== null && safeCount > seats
  const { title, subtitle } = claimCopy(trialPeriodDays)
  const availableUntil = trialPeriodDays === null ? null : formatDate(Date.now() + trialPeriodDays * DAY_MS)
  const isBusy = isRedirecting || isRemoving
  const checkoutError = isCheckoutError ? 'We couldn’t start the checkout. Please try again.' : undefined

  const claim = () => {
    if (!option?.paymentLinkId) return
    if (needsAccountsStep) setStep('accounts')
    else void startCheckout(option.paymentLinkId)
  }

  const continueToCheckout = async (removed: SafeRef[]) => {
    if (!option?.paymentLinkId) return
    if (removed.length > 0) {
      const result = await removeSafes({ spaceId, deleteSpaceSafesDto: { safes: removed } })
      if (result.error) return
    }
    await startCheckout(option.paymentLinkId)
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent size="sm-md" surface="card" padding="sm" showCloseButton={false}>
        <div className="flex flex-col gap-6 pt-5">
          {step === 'accounts' && tier && seats !== null ? (
            <SelectAccountsStep
              limit={seats}
              planName={tier.name}
              onBack={() => setStep('offer')}
              onContinue={(removed) => void continueToCheckout(removed)}
              isSubmitting={isBusy}
              error={
                removeError
                  ? getRtkQueryErrorMessage(removeError) || 'We couldn’t update the Workspace. Please try again.'
                  : checkoutError
              }
            />
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <Typography variant="h3" as={DialogTitle}>
                  {title}
                </Typography>
                <Typography color="muted">{subtitle}</Typography>
              </div>

              {isLoading ? (
                <Skeleton className="h-[260px] w-full rounded-lg-xl" data-testid="claim-trial-skeleton" />
              ) : tiers.length === 0 ? (
                <Alert variant="info">
                  <AlertSeverityIcon variant="info" />
                  <AlertDescription>There is no free trial available for this Workspace.</AlertDescription>
                </Alert>
              ) : (
                <div
                  role={tiers.length > 1 ? 'radiogroup' : undefined}
                  aria-label={tiers.length > 1 ? 'Plan' : undefined}
                  className="flex flex-col gap-4 md:flex-row"
                >
                  {tiers.map((candidate) => (
                    <TrialOfferCard
                      key={candidate.id}
                      tier={candidate}
                      availableUntil={availableUntil}
                      selectable={tiers.length > 1}
                      selected={candidate.id === tier?.id}
                      onSelect={() => setPickedTierId(candidate.id)}
                    />
                  ))}
                </div>
              )}

              <Typography variant="paragraph-small" color="muted" align="center">
                No billing details required. We’ll remind you before it ends. Cancel any time.
              </Typography>

              {checkoutError && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>{checkoutError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button variant="secondary" size="lg" className="flex-1" onClick={onBack} disabled={isBusy}>
                  {labels.back}
                </Button>
                <Button
                  size="lg"
                  accentIcon
                  className="flex-1"
                  disabled={!option?.paymentLinkId || isBusy}
                  onClick={claim}
                >
                  {labels.claim}
                  <ArrowRight />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
