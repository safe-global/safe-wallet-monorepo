export type PlanName = 'Starter' | 'Pro' | 'Pro+'

export type PlanStatusKind = 'within_limit' | 'approaching_limit' | 'limit_reached' | 'payment_failed'

export interface PlanMetric {
  used: number
  total: number
}

export interface PlanTier {
  id: string
  name: PlanName
  priceMonthlyUsd: number
  features: string[]
}

export interface PlanStatus {
  belongsToWorkspace: boolean
  planId: string
  planName: PlanName
  status: PlanStatusKind
  renewalDate: string
  feeFreeVolume: PlanMetric
  gaslessTransactions?: PlanMetric
  paygFeesThisPeriodUsd?: number
  activeSafes: string[]
}
