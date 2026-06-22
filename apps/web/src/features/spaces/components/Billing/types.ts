export type BillingPeriod = 'monthly' | 'yearly'

export interface PlanTier {
  id: string
  name: string
  priceMonthlyUsd: number
  features: string[]
  cta: string
  /** The currently-active plan renders a non-actionable CTA (e.g. "Default plan"). */
  isCurrent?: boolean
}

export interface PlanGroup {
  id: string
  /** One tier (Starter) or several selectable tiers (Pro / Pro+). */
  tiers: PlanTier[]
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled'

export interface Subscription {
  planId: string
  planName: string
  status: SubscriptionStatus
  currentPeriodEnd: string
}

export interface UsageSummary {
  movedUsd: number
  transactionCount: number
  periodDays: number
}

/** Paid-plan usage dashboard data. Distinct from UsageSummary, which feeds the Starter upsell. */
export interface SubscriptionUsage {
  feeFreeVolume: { usedUsd: number; allowanceUsd: number }
  gaslessTransactions: { used: number; allowance: number }
  /** Addresses of the Safes the subscription covers; drives the count + the avatar stack. */
  activeSafes: string[]
}

export type UsageStatus = 'within_limit' | 'approaching_limit' | 'limit_reached' | 'payment_failed'

export interface BillingState {
  /** `null` for the Starter / no-paid-plan state. */
  subscription: Subscription | null
  planGroups: PlanGroup[]
  usage: UsageSummary
  /** `null` for the Starter / no-paid-plan state. */
  subscriptionUsage: SubscriptionUsage | null
}
