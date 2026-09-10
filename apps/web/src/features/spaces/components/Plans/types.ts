export type Meter = { used: number; quota: number | null }

export type PlanSeatOption = {
  /** Null for the current plan and static tiers, which have no purchasable link. */
  paymentLinkId: string | null
  label: string
  price: number | null
  /** Undiscounted reference, e.g. twelve monthly payments for a yearly option. */
  originalPrice: number | null
}

export type PlanTier = {
  id: string
  name: string
  currency: string
  billingCycle: 'month' | 'year' | null
  options: PlanSeatOption[]
  features: string[]
  isCurrent?: boolean
  trialPeriodDays?: number | null
}

export type PlanSummary = { name: string; status: 'trialing' | 'active'; periodEndsAt: string | null }
