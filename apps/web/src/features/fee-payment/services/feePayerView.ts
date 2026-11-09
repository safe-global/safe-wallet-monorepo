import type { SponsoredOffer } from '@/utils/gasPayment'
import type { FeePayerControl, FeePayerFooter, FeePayerPlanState, GasPayerChoice } from '../types'

type Step = 'sign' | 'execute'
type SponsoredTxsMeter = Extract<SponsoredOffer, { option: 'SUBSCRIPTION' }>['meter']

type ChoiceAvailability = {
  step: Step
  hasSponsoredOffer: boolean
  isSafeOptionShown: boolean
}

const isChoiceAvailable = (
  candidate: GasPayerChoice | undefined,
  { step, hasSponsoredOffer, isSafeOptionShown }: ChoiceAvailability,
): candidate is GasPayerChoice =>
  candidate === 'WALLET' ||
  (candidate === 'SPONSORED' && hasSponsoredOffer && step === 'execute') ||
  (candidate === 'PAY_FROM_SAFE' && isSafeOptionShown)

/** Locked payload → the signer's pick → a sponsor at execution → the remembered pick → the wallet. */
export const resolveChoice = ({
  isLocked,
  explicitChoice,
  preferredChoice,
  ...availability
}: ChoiceAvailability & {
  isLocked: boolean
  explicitChoice?: GasPayerChoice
  preferredChoice?: GasPayerChoice
}): GasPayerChoice => {
  if (isLocked) return 'PAY_FROM_SAFE'
  if (isChoiceAvailable(explicitChoice, availability)) return explicitChoice
  if (availability.hasSponsoredOffer && availability.step === 'execute') return 'SPONSORED'
  if (isChoiceAvailable(preferredChoice, availability)) return preferredChoice
  return 'WALLET'
}

const safeOrWallet = (choice: GasPayerChoice): FeePayerControl => ({
  kind: 'choice',
  value: choice === 'PAY_FROM_SAFE' ? 'PAY_FROM_SAFE' : 'WALLET',
  options: ['PAY_FROM_SAFE', 'WALLET'],
})

export const buildPayerControl = ({
  isLocked,
  step,
  planState,
  offersSafeToggle,
  isProposing,
  hasSponsoredOffer,
  choice,
}: {
  isLocked: boolean
  step: Step
  planState: FeePayerPlanState
  offersSafeToggle: boolean
  isProposing: boolean
  hasSponsoredOffer: boolean
  choice: GasPayerChoice
}): FeePayerControl => {
  if (isLocked) return { kind: 'locked', value: 'PAY_FROM_SAFE' }
  if (step === 'sign') {
    if (planState === 'PRO_SPONSORED_LEFT') return { kind: 'locked', value: 'SPONSORED' }
    if (offersSafeToggle) return safeOrWallet(choice)
    if (isProposing) {
      return { kind: 'locked', value: 'WALLET', reason: 'FIRST_SIGNER_PICKS' }
    }
    return { kind: 'locked', value: 'WALLET' }
  }
  if (hasSponsoredOffer) {
    return {
      kind: 'choice',
      value: choice === 'SPONSORED' ? 'SPONSORED' : 'WALLET',
      options: ['SPONSORED', 'WALLET'],
    }
  }
  if (offersSafeToggle) return safeOrWallet(choice)
  return { kind: 'locked', value: 'WALLET' }
}

/** At execution the offer decides the strip; at signing the Workspace meter, where the chain sponsors plans. */
export const buildFooter = ({
  offer,
  chainSponsorsPlans,
  planState,
  left,
  meter,
}: {
  offer: SponsoredOffer | null
  chainSponsorsPlans: boolean
  planState: FeePayerPlanState
  left: number | null
  meter: SponsoredTxsMeter
}): FeePayerFooter => {
  if (offer?.option === 'SUBSCRIPTION') {
    return {
      kind: 'counter',
      left: offer.left,
      quota: offer.meter?.quota ?? null,
      resetsAt: offer.meter?.resetsAt ?? null,
      isSubscription: true,
    }
  }
  if (offer?.option === 'FREE_DAILY_LIMIT') {
    return {
      kind: 'counter',
      left: offer.relays?.remaining ?? null,
      quota: offer.relays?.limit ?? null,
      resetsAt: null,
      isSubscription: false,
    }
  }
  if (offer?.option === 'NO_FEE_CAMPAIGN') {
    return { kind: 'counter', left: offer.remaining, quota: offer.limit, resetsAt: null, isSubscription: false }
  }
  if (!chainSponsorsPlans) return { kind: 'none' }
  if (planState === 'FREE') return { kind: 'upsell' }
  return { kind: 'counter', left, quota: meter?.quota ?? null, resetsAt: meter?.resetsAt ?? null, isSubscription: true }
}
