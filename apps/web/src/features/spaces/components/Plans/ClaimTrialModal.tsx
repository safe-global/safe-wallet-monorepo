import { useMemo, useState, type CSSProperties } from 'react'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Link } from '@/components/ui/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { formatDate } from '@safe-global/utils/utils/date'
import { DAY_MS } from '../../hooks/billing/subscription'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useSeatTrimCheckout } from '../../hooks/billing/useSeatTrimCheckout'
import { RECOMMENDED_PLAN } from './planCatalog'
import { claimTiers, formatPlanPrice, priceSuffix } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import { InfoTip } from './PlanStatusCard'
import type { PlanTier, SafeRef } from './types'

// The CGW grants the 60-day grace only to Workspaces that predate enforcement; anything else is a new Workspace.
const MIGRATED_TRIAL_DAYS = 60

/** `existing` locks a Workspace that predates Safe Pro; `new` greets one the wizard just created. */
export type ClaimTrialVariant = 'existing' | 'new'

export type ClaimTrialCopy = { title: string; subtitle: string; note: string; back: string; claim: string }

/** What happens when the trial runs out, behind the info icon next to the note. */
export const TRIAL_END_TOOLTIP =
  "Your paid subscription only starts after you add a payment method. If you don't add one or choose another plan before your free access ends, your Workspace will be locked. Nothing is deleted for 90 days and your Safe accounts remain available in My accounts."

/** The price tag's green word: a new Workspace is told how long the free period lasts, an existing one just "Free". */
export const _freeLabel = (trialPeriodDays: number | null, variant: ClaimTrialVariant): string =>
  variant === 'new' && trialPeriodDays !== null ? `${trialPeriodDays}-day free` : 'Free'

export const claimCopy = (trialPeriodDays: number | null, variant: ClaimTrialVariant = 'existing'): ClaimTrialCopy => {
  if (variant === 'new') {
    return {
      title: 'Workspaces run on Safe Pro',
      subtitle: trialPeriodDays === null ? 'Your first days are free.' : `Your first ${trialPeriodDays} days are free.`,
      note: "No payment method required. We'll remind you 7 days before your free access ends.",
      back: 'Go to My accounts',
      claim: 'Claim free access',
    }
  }
  const existing = {
    note: "No payment method required. We'll remind you 7 days before your free access ends.",
    back: 'Go to My accounts',
    claim: 'Claim free access',
  }
  return trialPeriodDays === MIGRATED_TRIAL_DAYS
    ? {
        ...existing,
        title: 'Your Workspace moved to Safe Pro on Oct 6, 2026',
        subtitle: 'You’ve used Safe before, so your free access is 60 days instead of 30.',
      }
    : {
        ...existing,
        title:
          trialPeriodDays === null
            ? 'Start your free access to Safe Pro'
            : `Start your ${trialPeriodDays}-day free access to Safe Pro`,
        subtitle: 'All Pro features unlocked. No billing details needed upfront.',
      }
}

const TrialOfferCard = ({
  tier,
  availableUntil,
  freeText,
  selectable,
  selected,
  onSelect,
}: {
  tier: PlanTier
  availableUntil: string | null
  freeText: string
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
                {freeText}
              </Typography>
            </div>
            {availableUntil && (
              <Typography variant="paragraph-small" color="muted">
                Available until {availableUntil}.
              </Typography>
            )}
          </div>

          {/* Column-major like the design: the first half of the list on the left, the rest on the right. */}
          <ul
            className="grid gap-x-6 gap-y-2 sm:grid-flow-col sm:grid-rows-[repeat(var(--rows),auto)]"
            style={{ '--rows': Math.ceil(tier.features.length / 2) } as CSSProperties}
          >
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

/** The Safes left out are removed from the Workspace, not from the user's accounts. */
export default function ClaimTrialModal({
  spaceId,
  onBack,
  returnPathname,
  variant = 'existing',
}: {
  spaceId: string
  onBack: () => void
  /** Where Stripe sends the user back; defaults to the Workspace Home. */
  returnPathname?: string
  variant?: ClaimTrialVariant
}) {
  const { trialPlans, trialPeriodDays, isLoading } = useSpaceOffers(spaceId)
  const tiers = useMemo(() => claimTiers(trialPlans), [trialPlans])
  const { needsTrim, checkout, isBusy, error } = useSeatTrimCheckout(spaceId, returnPathname)
  const [pickedTierId, setPickedTierId] = useState<string>()
  const [step, setStep] = useState<'offer' | 'accounts'>('offer')

  const tier =
    tiers.find((candidate) => candidate.id === pickedTierId) ??
    tiers.find((candidate) => candidate.name === RECOMMENDED_PLAN) ??
    tiers[0]
  const option = tier?.options[0]
  const seats = option?.seats ?? null
  const copy = claimCopy(trialPeriodDays, variant)
  const availableUntil = trialPeriodDays === null ? null : formatDate(Date.now() + trialPeriodDays * DAY_MS)

  const claim = () => {
    if (!option?.paymentLinkId) return
    if (needsTrim(seats)) setStep('accounts')
    else void checkout(option.paymentLinkId)
  }

  const continueToCheckout = (removed: SafeRef[]) => {
    if (option?.paymentLinkId) void checkout(option.paymentLinkId, removed)
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
              onContinue={continueToCheckout}
              isSubmitting={isBusy}
              error={error}
            />
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <Typography variant="h3" as={DialogTitle}>
                  {highlightSafePro(copy.title)}
                </Typography>
                <Typography color="muted">{copy.subtitle}</Typography>
              </div>

              <Link
                href={SAFE_PRO_ANNOUNCEMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="muted"
                className="self-start"
              >
                Compare all features <ArrowUpRight />
              </Link>

              {isLoading ? (
                <Skeleton className="h-65 w-full rounded-lg-xl" data-testid="claim-trial-skeleton" />
              ) : tiers.length === 0 ? (
                <Alert variant="info">
                  <AlertSeverityIcon variant="info" />
                  <AlertDescription>There is no free access available for this Workspace.</AlertDescription>
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
                      freeText={_freeLabel(trialPeriodDays, variant)}
                      selectable={tiers.length > 1}
                      selected={candidate.id === tier?.id}
                      onSelect={() => setPickedTierId(candidate.id)}
                    />
                  ))}
                </div>
              )}

              <Typography variant="paragraph-small" align="center" className="flex items-center justify-center gap-1.5">
                {copy.note}
                <InfoTip text={TRIAL_END_TOOLTIP} data-testid="trial-end-tooltip" />
              </Typography>

              {error && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button variant="secondary" size="lg" className="flex-1" onClick={onBack} disabled={isBusy}>
                  {copy.back}
                </Button>
                <Button
                  size="lg"
                  accentIcon
                  className="flex-1"
                  disabled={!option?.paymentLinkId || isBusy}
                  onClick={claim}
                >
                  {copy.claim}
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
