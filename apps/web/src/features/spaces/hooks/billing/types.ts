export type BillingCycle = 'month' | 'year'

export type PlanOffer = {
  paymentLinkId: string
  planName: string
  /** `null` when the link carries no seat tag; `'unlimited'` mirrors the CGW metadata value. */
  seats: number | 'unlimited' | null
  /** Whole currency units; `null` when the link has no priced line item. */
  price: number | null
  currency: string
  billingCycle: BillingCycle | null
  trialPeriodDays: number | null
}

export type PlanGroup = {
  name: string
  offers: PlanOffer[]
}

export type SeatsMeter = {
  used: number
  quota: number | null
}
