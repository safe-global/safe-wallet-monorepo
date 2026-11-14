import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Link } from '@safe-global/views/components/ui/link'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Typography } from '@safe-global/views/components/ui/typography'
import { SAFE_PRO_PRICING_URL } from '@/config/constants'
import { highlightSafePro } from '@safe-global/views/components/common/ProHighlight'
import Track from '@/components/common/Track'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { DismissAction, FreeAccessEntryPoint, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useSeatTrimCheckout } from '../../hooks/billing/useSeatTrimCheckout'
import {
  TrialFeatureList,
  TrialPriceLine,
  TrialSizeTabs,
} from '@safe-global/views/features/spaces/components/Plans/TrialPlanParts'
import { trialFeaturesOf, trialSizes } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import { InfoTip } from './PlanStatusCard'
import type { SafeRef } from '@safe-global/views/features/spaces/components/Plans/types'

// The CGW grants the 60-day grace only to Workspaces that predate enforcement; anything else is a new Workspace.
const MIGRATED_TRIAL_DAYS = 60

/** `existing` locks a Workspace that predates Safe Pro; `new` greets one the wizard just created. */
export type ClaimTrialVariant = 'existing' | 'new'

/** What happens when the trial runs out, behind the info icon next to the note. */
export const TRIAL_END_TOOLTIP =
  "Your paid subscription only starts once you add a payment method. If you don't add one or choose another plan before your free access ends, your Workspace will be locked. Its data is kept for 90 days and your Safe accounts remain available in My accounts."

/** The trial offer's headline, which members of a locked Workspace see too. */
export const claimTitle = (trialPeriodDays: number | null): string => {
  if (trialPeriodDays === MIGRATED_TRIAL_DAYS) return 'Your Workspace moved to Safe Pro'
  return trialPeriodDays === null
    ? 'Start your free access to Safe Pro'
    : `Start your ${trialPeriodDays}-day free access to Safe Pro`
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
  const sizes = useMemo(() => trialSizes(trialPlans), [trialPlans])
  const { needsTrim, checkout, isBusy, error } = useSeatTrimCheckout(spaceId, returnPathname)
  const [pickedLinkId, setPickedLinkId] = useState<string>()
  const [step, setStep] = useState<'offer' | 'accounts'>('offer')

  const size = sizes.find((candidate) => candidate.paymentLinkId === pickedLinkId) ?? sizes[0]
  const entry = {
    [MixpanelEventParams.ENTRY_POINT]:
      variant === 'new' ? FreeAccessEntryPoint.CREATE_WORKSPACE : FreeAccessEntryPoint.WORKSPACE_LOGIN,
  }
  useTrackOnce(
    SAFE_PRO_EVENTS.FREE_ACCESS_OFFER_VIEWED,
    { ...entry, [MixpanelEventParams.FREE_ACCESS_LENGTH]: trialPeriodDays ?? undefined },
    !isLoading,
  )

  const claim = () => {
    if (!size) return
    if (needsTrim(size.seats)) setStep('accounts')
    else void checkout(size.paymentLinkId)
  }

  const continueToCheckout = (removed: SafeRef[]) => {
    if (size) void checkout(size.paymentLinkId, removed)
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent size="xs" surface="card" padding="sm" showCloseButton={false} data-testid="claim-trial-modal">
        <div className="flex flex-col gap-6 pt-5">
          {step === 'accounts' && size ? (
            <SelectAccountsStep
              limit={size.seats}
              planName={size.planName}
              onBack={() => setStep('offer')}
              onContinue={continueToCheckout}
              isSubmitting={isBusy}
              error={error}
            />
          ) : (
            <>
              {isLoading ? (
                <Skeleton className="h-96 w-full rounded-lg-xl" data-testid="claim-trial-skeleton" />
              ) : !size ? (
                <Alert variant="info">
                  <AlertSeverityIcon variant="info" />
                  <AlertDescription>There is no free access available for this Workspace.</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <Typography variant="h3" as={DialogTitle}>
                      {highlightSafePro(`Safe Pro ${size.planName}`)}
                    </Typography>
                    <Typography color="muted" className="min-h-[2lh]">
                      {size.subtitle}{' '}
                      <Link href={SAFE_PRO_PRICING_URL} target="_blank" rel="noopener noreferrer" variant="muted">
                        Compare plans <ArrowUpRight />
                      </Link>
                    </Typography>
                  </div>

                  <TrialSizeTabs
                    sizes={sizes}
                    value={size}
                    onChange={(picked) => setPickedLinkId(picked.paymentLinkId)}
                  />
                  <TrialFeatureList features={trialFeaturesOf(size.planName)} columns={2} />
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                {size && <TrialPriceLine size={size} trialPeriodDays={trialPeriodDays} />}
                <Track {...SAFE_PRO_EVENTS.FREE_ACCESS_CLAIM_CLICKED} mixpanelParams={entry} as="div">
                  <Button
                    size="lg"
                    weight="semibold"
                    accentIcon
                    className="w-full"
                    disabled={!size || isBusy}
                    onClick={claim}
                  >
                    Start free trial
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
                    Go to My accounts
                  </Button>
                </Track>
              </div>

              <Typography
                variant="paragraph-small"
                color="muted"
                align="center"
                className="flex items-center justify-center gap-1.5"
              >
                No card needed. You won&apos;t be charged after the trial ends.
                <InfoTip text={TRIAL_END_TOOLTIP} data-testid="trial-end-tooltip" />
              </Typography>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
