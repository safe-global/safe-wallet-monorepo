export type Meter = { used: number; quota: number | null }

/** A Safe as the Workspace endpoints address it. */
export type SafeRef = { chainId: string; address: string }

export type PlanSeatOption = {
  /** Null for static tiers, which have no purchasable link. */
  paymentLinkId: string | null
  /** Stripe price id behind the link; the plan-change endpoints identify the target plan by it. */
  priceId: string | null
  label: string
  /** Seat quota behind the option; null when unlimited or unknown. */
  seats?: number | null
  price: number | null
  /** Undiscounted reference, e.g. twelve monthly payments for a yearly option. */
  originalPrice: number | null
  /** Selling points of this seat size when Stripe carries them; the card falls back to the tier's list. */
  features?: string[]
}

export type PlanTier = {
  id: string
  name: string
  currency: string
  billingCycle: 'month' | 'year' | null
  options: PlanSeatOption[]
  features: string[]
  isCurrent?: boolean
  /** On the current plan's card, the price the subscription is on; the other options are seat changes. */
  currentPriceId?: string | null
  trialPeriodDays?: number | null
}

/** What the user picked on a plan card: the tier and the seat option (one payment link) within it. */
export type PlanPick = { tier: PlanTier; option: PlanSeatOption }

/** The live subscription as the cards need it: to tell an upgrade from a downgrade, and to adapt the trial copy. */
export type CurrentPlan = {
  name: string
  price: number
  currency: string
  billingCycle: 'month' | 'year' | null
  isTrialing: boolean
  /** During the trial: a payment method is already on file, so nothing needs adding. */
  hasPaymentMethod?: boolean
  periodEndsAt: string | null
  daysLeft?: number | null
  /** "20 Safe accounts", when the seats quota is known. */
  seatsLabel?: string
}

export type PlanChangeDirection = 'upgrade' | 'downgrade' | 'change'

/** What a plan card's button does: manage the current plan, move to another one, buy one, or contact sales. */
export type PlanCta =
  | { kind: 'billing'; label: 'Add payment method' }
  | { kind: 'manage'; label: 'Manage plan' }
  | { kind: 'change'; label: string; direction: PlanChangeDirection }
  | { kind: 'subscribe'; label: string }
  | { kind: 'sales'; label: 'Talk to sales' }

export type PlanSummary = {
  name: string
  status: 'trialing' | 'active'
  periodEndsAt: string | null
  daysLeft: number | null
  hasPaymentMethod?: boolean
}
