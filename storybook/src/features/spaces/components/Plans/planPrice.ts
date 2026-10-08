import type { PlanOffer } from '@/features/spaces/hooks/billing/types'

export const formatPlanPrice = (price: number, currency: string): string =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

export const priceSuffix = (billingCycle: 'month' | 'year' | null): string => (billingCycle === 'year' ? '/yr' : '/mo')

export const seatsLabel = (seats: PlanOffer['seats']): string =>
  seats === null ? 'Safe accounts' : seats === 'unlimited' ? 'Unlimited Safe accounts' : `${seats} Safe accounts`
