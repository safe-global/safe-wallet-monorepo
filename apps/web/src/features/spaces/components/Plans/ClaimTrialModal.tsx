import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { SAFE_PRO_PRICING_URL } from '@/config/constants'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Link } from '@safe-global/views/components/ui/link'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Typography } from '@safe-global/views/components/ui/typography'
import { highlightSafePro } from '@safe-global/views/components/common/ProHighlight'
import { formatDate } from '@safe-global/utils/utils/date'
import Track from '@/components/common/Track'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { DismissAction, FreeAccessEntryPoint, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { DAY_MS } from '../../hooks/billing/subscription'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useSeatTrim } from '../../hooks/billing/useSeatTrim'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { SafeProTrialActivatedModal } from '@safe-global/views/features/spaces/components/SafeProModals'
import { useAppDispatch } from '@/store'
import { useBillingStartTrialV1Mutation } from './proTrial/startTrialApi'
import TrialDetailsStep from './proTrial/TrialDetailsStep'
import type { TrialDetails } from './proTrial/trialDetails'
import { RECOMMENDED_PLAN } from '@safe-global/views/features/spaces/components/Plans/planCatalog'
import { FeatureCheck } from './FeatureCheck'
import { _offersToTiers, claimTiers } from './planTiers'
import { PRO_TRIAL_COPY } from './proTrial/copy'
import SelectAccountsStep from './SelectAccountsStep'
import type { SafeRef } from '@safe-global/views/features/spaces/components/Plans/types'

// The CGW grants the 60-day grace only to Workspaces that predate enforcement; anything else is a new Workspace.
const MIGRATED_TRIAL_DAYS = 60

/** `existing` locks a Workspace that predates Safe Pro; `new` greets one the wizard just created. */
export type ClaimTrialVariant = 'existing' | 'new'

export type ClaimTrialCopy = { title: string; subtitle: string; note: string; back: string; claim: string }

/** What happens when the trial runs out, behind the info icon next to the note. */
export const TRIAL_END_TOOLTIP =
  "Your paid subscription only starts once you add a payment method. If you don't add one or choose another plan before your free access ends, your Workspace will be locked. Its data is kept for 90 days and your Safe accounts remain available in My accounts."

/** The price tag's green word: a new Workspace is told how long the free period lasts, an existing one just "Free". */
export const _freeLabel = (trialPeriodDays: number | null, variant: ClaimTrialVariant): string =>
  variant === 'new' && trialPeriodDays !== null ? `${trialPeriodDays}-day free` : 'Free'

export const claimCopy = (trialPeriodDays: number | null, variant: ClaimTrialVariant = 'existing'): ClaimTrialCopy => {
  if (variant === 'new') {
    return {
      title: PRO_TRIAL_COPY.trialStart.title(trialPeriodDays),
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
        title: PRO_TRIAL_COPY.trialStart.title(trialPeriodDays),
        subtitle:
          'You’ve used Safe before, so your free access is 60 days instead of 30.\nYour Safe accounts remain available in My accounts.',
      }
    : {
        ...existing,
        title: PRO_TRIAL_COPY.trialStart.title(trialPeriodDays),
        subtitle: 'All Pro features unlocked. No billing details needed upfront.',
      }
}

/** The Safes left out are removed from the Workspace, not from the user's accounts. */
export default function ClaimTrialModal({
  spaceId,
  onBack,
  variant = 'existing',
  startOnDetails = false,
  detailsTitle,
}: {
  spaceId: string
  onBack: () => void
  /** Kept for the callers; the trial no longer goes through Stripe, so nothing returns to it. */
  returnPathname?: string
  variant?: ClaimTrialVariant
  /** Workspace first (variant B): the user is already inside, so the modal opens on the details form. */
  startOnDetails?: boolean
  detailsTitle?: string
}) {
  const { trialPlans, trialPeriodDays, isLoading } = useSpaceOffers(spaceId)
  const tiers = useMemo(() => claimTiers(trialPlans), [trialPlans])
  const dispatch = useAppDispatch()
  const { needsTrim, trim, isTrimming, error } = useSeatTrim(spaceId)
  const [startTrial, { isLoading: isStarting, isError: isStartError }] = useBillingStartTrialV1Mutation()
  const [step, setStep] = useState<'offer' | 'details' | 'accounts' | 'activated'>(startOnDetails ? 'details' : 'offer')
  const [details, setDetails] = useState<TrialDetails>()
  const isBusy = isTrimming || isStarting

  // The trial runs on the plan the CGW offers it on; the modal no longer shows which.
  const tier = tiers.find((candidate) => candidate.name === RECOMMENDED_PLAN) ?? tiers[0]
  const option = tier?.options[0]
  // What the trial plan includes, as Stripe lists it, without its seat count or price.
  const features = useMemo(
    () =>
      _offersToTiers(trialPlans).find(
        (candidate) => candidate.name === tier?.name && candidate.billingCycle === 'month',
      )?.features ?? [],
    [trialPlans, tier?.name],
  )
  const seats = option?.seats ?? null
  const endsOn = trialPeriodDays === null ? null : formatDate(Date.now() + trialPeriodDays * DAY_MS)
  const entry = {
    [MixpanelEventParams.ENTRY_POINT]:
      variant === 'new' ? FreeAccessEntryPoint.CREATE_WORKSPACE : FreeAccessEntryPoint.WORKSPACE_LOGIN,
  }
  useTrackOnce(
    SAFE_PRO_EVENTS.FREE_ACCESS_OFFER_VIEWED,
    { ...entry, [MixpanelEventParams.FREE_ACCESS_LENGTH]: trialPeriodDays ?? undefined },
    !isLoading,
  )

  const claim = () => setStep('details')

  // The billing service creates the Stripe customer and a trial with no card; no Stripe page is shown.
  const start = async (submitted: TrialDetails) => {
    const result = await startTrial({
      spaceId,
      body: {
        email: submitted.email.trim(),
        name: submitted.name.trim(),
        company: submitted.company.trim() || undefined,
        acceptsTerms: true,
      },
    })
    if (!('error' in result)) setStep('activated')
  }

  const submitDetails = (submitted: TrialDetails) => {
    setDetails(submitted)
    if (needsTrim(seats)) setStep('accounts')
    else void start(submitted)
  }

  const continueAfterTrim = async (removed: SafeRef[]) => {
    if (details && (await trim(removed))) void start(details)
  }

  // Refetching the plan clears the lock, which closes this modal and shows the trial banner.
  const enterWorkspace = () => dispatch(cgwClient.util.invalidateTags(['billing', 'entitlements'] as never[]))

  if (step === 'activated') {
    return (
      <SafeProTrialActivatedModal
        open
        onOpenChange={(open) => !open && enterWorkspace()}
        trialEndsAt={trialPeriodDays === null ? null : Date.now() + trialPeriodDays * DAY_MS}
      />
    )
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        size={step === 'accounts' ? 'sm-md' : 'xs'}
        data-testid="claim-trial-modal"
        surface="card"
        padding="sm"
        showCloseButton={false}
        // eslint-disable-next-line no-restricted-syntax -- prototype: the trial modal carries the Safe Pro mint stroke; a real PR adds a DialogContent variant
        className="border-2 border-mint"
      >
        <div className="flex flex-col gap-6 pt-5">
          {step === 'accounts' && tier && seats !== null ? (
            <SelectAccountsStep
              limit={seats}
              planName={tier.name}
              onBack={() => setStep('details')}
              onContinue={(removed) => void continueAfterTrim(removed)}
              isSubmitting={isBusy}
              error={error}
            />
          ) : step === 'details' ? (
            <TrialDetailsStep
              title={detailsTitle}
              backLabel={startOnDetails ? PRO_TRIAL_COPY.trialDetails.notNow : PRO_TRIAL_COPY.trialDetails.back}
              isSubmitting={isBusy}
              error={isStartError}
              onBack={() => (startOnDetails ? onBack() : setStep('offer'))}
              onSubmit={submitDetails}
            />
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <Typography variant="h3" as={DialogTitle}>
                  {highlightSafePro(PRO_TRIAL_COPY.trialStart.title(trialPeriodDays))}
                </Typography>
                <Typography color="muted">
                  {PRO_TRIAL_COPY.trialStart.tagline}{' '}
                  <Link
                    href={SAFE_PRO_PRICING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="muted"
                    className="whitespace-nowrap"
                    data-testid="trial-see-plans"
                  >
                    {PRO_TRIAL_COPY.trialStart.seePlans} <ArrowUpRight />
                  </Link>
                </Typography>
                {trialPeriodDays === MIGRATED_TRIAL_DAYS && (
                  <Typography variant="paragraph-small" color="muted">
                    {PRO_TRIAL_COPY.trialStart.migrated}
                  </Typography>
                )}
              </div>

              {isLoading ? (
                <Skeleton className="h-40 w-full rounded-lg-xl" data-testid="claim-trial-skeleton" />
              ) : tiers.length === 0 ? (
                <Alert variant="info">
                  <AlertSeverityIcon variant="info" />
                  <AlertDescription>{PRO_TRIAL_COPY.trialStart.unavailable}</AlertDescription>
                </Alert>
              ) : (
                <ul className="flex flex-col gap-3" data-testid="trial-features">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <FeatureCheck />
                      <Typography variant="paragraph-small">{feature}</Typography>
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Track {...SAFE_PRO_EVENTS.FREE_ACCESS_CLAIM_CLICKED} mixpanelParams={entry} as="div">
                  <Button
                    size="lg"
                    weight="semibold"
                    accentIcon
                    className="w-full"
                    disabled={!option?.paymentLinkId || isBusy}
                    onClick={claim}
                  >
                    {PRO_TRIAL_COPY.trialStart.start}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </Track>
                <Track
                  {...SAFE_PRO_EVENTS.FREE_ACCESS_OFFER_DISMISSED}
                  mixpanelParams={{ ...entry, [MixpanelEventParams.DISMISS_ACTION]: DismissAction.GO_TO_MY_ACCOUNTS }}
                  as="div"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    weight="semibold"
                    className="w-full"
                    onClick={onBack}
                    disabled={isBusy}
                  >
                    {PRO_TRIAL_COPY.trialStart.back}
                  </Button>
                </Track>
              </div>

              <Typography variant="paragraph-small" color="muted" align="center">
                {PRO_TRIAL_COPY.trialStart.noCharge(endsOn)}
              </Typography>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
