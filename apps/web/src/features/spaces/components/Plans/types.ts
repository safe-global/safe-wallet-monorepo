export type Meter = { used: number; quota: number | null }

export type PlanTier = {
  id: string
  name: string
  price: number | null
  originalPrice: number | null
  currency: 'usd' | 'eur'
  billingCycle: 'month' | 'year' | null
  seats: string[]
  features: string[]
  isCurrent?: boolean
}

export type PlansData = {
  plan: { name: string; status: 'trialing' | 'active'; periodEndsAt: string | null } | null
  safeAccounts: Meter
  sponsoredTxs: Meter
  tiers: PlanTier[]
}
