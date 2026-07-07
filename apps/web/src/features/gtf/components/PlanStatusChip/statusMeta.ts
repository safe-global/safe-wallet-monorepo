import type { PlanStatusKind } from './types'

export const STATUS_LABEL: Record<PlanStatusKind, string> = {
  within_limit: 'Within limit',
  approaching_limit: 'Approaching limit',
  limit_reached: 'Limit reached',
  payment_failed: 'Payment failed',
}

export type StatusVariant = 'success' | 'warning' | 'error'

export const STATUS_VARIANT: Record<PlanStatusKind, StatusVariant> = {
  within_limit: 'success',
  approaching_limit: 'warning',
  limit_reached: 'error',
  payment_failed: 'error',
}
