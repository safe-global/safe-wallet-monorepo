import { useMemo, useState } from 'react'
import { SAFE_PRO_PRICING_URL } from '@/config/constants'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { DismissAction, FreeAccessEntryPoint, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { DAY_MS } from '../../hooks/billing/subscription'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useSeatTrimCheckout } from '../../hooks/billing/useSeatTrimCheckout'
import { RECOMMENDED_PLAN } from '@views/features/spaces/components/Plans/planCatalog'
import { claimTiers, pickProps } from './planTiers'
import SelectAccountsStep from './SelectAccountsStep'
import type { SafeRef } from '@views/features/spaces/components/Plans/types'
import {
  ClaimTrialModalView,
  type ClaimTrialVariant,
} from '@views/features/spaces/components/Plans/ClaimTrialModalView'

export {
  _freeLabel,
  claimCopy,
  TRIAL_END_TOOLTIP,
  type ClaimTrialCopy,
  type ClaimTrialVariant,
} from '@views/features/spaces/components/Plans/ClaimTrialModalView'

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
  const availableUntil = trialPeriodDays === null ? null : Date.now() + trialPeriodDays * DAY_MS
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
    if (!tier || !option?.paymentLinkId) return
    if (needsTrim(seats)) setStep('accounts')
    else void checkout(option.paymentLinkId, { ...pickProps({ tier, option }), ...entry })
  }

  const continueToCheckout = (removed: SafeRef[]) => {
    if (tier && option?.paymentLinkId)
      void checkout(option.paymentLinkId, { ...pickProps({ tier, option }), ...entry }, removed)
  }

  return (
    <ClaimTrialModalView
      variant={variant}
      trialPeriodDays={trialPeriodDays}
      accountsStep={
        step === 'accounts' && tier && seats !== null ? (
          <SelectAccountsStep
            limit={seats}
            planName={tier.name}
            onBack={() => setStep('offer')}
            onContinue={continueToCheckout}
            isSubmitting={isBusy}
            error={error}
          />
        ) : undefined
      }
      pricingUrl={SAFE_PRO_PRICING_URL}
      isLoading={isLoading}
      tiers={tiers}
      selectedTierId={tier?.id}
      onSelectTier={setPickedTierId}
      availableUntil={availableUntil}
      error={error}
      isBusy={isBusy}
      canClaim={Boolean(option?.paymentLinkId)}
      onBack={onBack}
      onClaim={claim}
      dismissTrackingParams={{ ...entry, [MixpanelEventParams.DISMISS_ACTION]: DismissAction.GO_TO_MY_ACCOUNTS }}
      claimTrackingParams={entry}
    />
  )
}
