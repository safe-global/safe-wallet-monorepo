export type BillingCycle = 'month' | 'year'

export type PlanOffer = {
  paymentLinkId: string
  /** Stripe price id of the link's line item; what the plan-change endpoints call `planId`. */
  priceId: string | null
  planName: string
  /** `null` when the link carries no seat tag; `'unlimited'` mirrors the CGW metadata value. */
  seats: number | 'unlimited' | null
  /** Whole currency units; `null` when the link has no priced line item. */
  price: number | null
  currency: string
  billingCycle: BillingCycle | null
  trialPeriodDays: number | null
  /** The plan's selling points as Stripe carries them (`metadata.planDescriptions`), shown verbatim and in order. */
  features?: string[]
}

export type PlanGroup = {
  name: string
  offers: PlanOffer[]
}

export type SeatsMeter = {
  used: number
  quota: number | null
}

/** A metered entitlement that refills: `resetsAt` is when the count restarts (ISO), null when it never does. */
export type SponsoredTxsMeter = SeatsMeter & { resetsAt: string | null }
