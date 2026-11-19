export type TrialPlanName = 'Starter' | 'Business'

export type TrialSize = { seats: number; plan: TrialPlanName; monthlyPrice: number }

export type TrialFeature = { label: string; included: boolean }

export const TRIAL_DAYS = 30

/** Monthly prices from safe.global/pricing; the prototype has no billing data behind it. */
export const TRIAL_SIZES: TrialSize[] = [
  { seats: 2, plan: 'Starter', monthlyPrice: 189 },
  { seats: 5, plan: 'Business', monthlyPrice: 669 },
  { seats: 10, plan: 'Business', monthlyPrice: 999 },
  { seats: 20, plan: 'Business', monthlyPrice: 1669 },
]

export const DEFAULT_SIZE = TRIAL_SIZES[0]

export const PLAN_SUBTITLE: Record<TrialPlanName, string> = {
  Starter: 'Coordinate your team with a shared home for your Safes and transactions.',
  Business: 'Scale with control. Delegate daily operations with hands-on help.',
}

/** One list for both plans: Business-only rows stay on Starter as excluded, so switching shows what's missing. */
export const trialFeatures = (plan: TrialPlanName): TrialFeature[] => {
  const isBusiness = plan === 'Business'
  return [
    { label: isBusiness ? '50 sponsored txs/month' : '10 sponsored txs/month', included: true },
    { label: 'Unlimited members', included: true },
    { label: 'Recipient checks', included: true },
    { label: 'Transaction simulation', included: true },
    { label: 'Shared address book', included: true },
    { label: 'Activity log and 2FA', included: true },
    { label: 'Policies', included: isBusiness },
    { label: 'Proposers', included: isBusiness },
    { label: 'Priority support', included: isBusiness },
    { label: 'Guided onboarding', included: isBusiness },
  ]
}

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)

export const findSize = (seats: number | undefined) => TRIAL_SIZES.find((size) => size.seats === seats) ?? DEFAULT_SIZE
