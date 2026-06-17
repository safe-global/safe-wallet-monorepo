export type BillingInterval = 'month' | 'year'

export interface BillingPlan {
  id: string
  name: string
  priceUsd: number
  interval: BillingInterval
  features: string[]
  highlighted?: boolean
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

export interface BillingState {
  /** `null` for the Starter / no-paid-plan state. */
  subscription: Subscription | null
  currentPlanId: string | null
  plans: BillingPlan[]
  usage: UsageSummary
}
