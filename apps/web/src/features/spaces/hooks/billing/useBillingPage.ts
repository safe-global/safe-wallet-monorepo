import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useBillingSubscription } from './useBillingSubscription'
import { useCheckoutReturn, type CheckoutReturnStatus } from './useCheckoutReturn'
import { getBillingState, type BillingState } from './subscriptionState'

interface BillingPageState {
  state: BillingState
  subscription: Subscription | undefined
  isLoading: boolean
  /** Return-from-Stripe status; `idle` when not returning from checkout. */
  checkoutStatus: CheckoutReturnStatus
  isReturning: boolean
  dismissCheckout: () => void
}

/**
 * Single source of truth for the Billing page: resolves the active subscription,
 * the return-from-checkout status, and the derived high-level billing state
 * (none / activating / active / payment_failed / canceled).
 */
export const useBillingPage = (): BillingPageState => {
  const { subscription, isLoading } = useBillingSubscription()
  const { isReturning, status: checkoutStatus, dismiss } = useCheckoutReturn()

  const isActivating = isReturning && (checkoutStatus === 'processing' || checkoutStatus === 'activating')
  const state = getBillingState(subscription, isActivating)

  return {
    state,
    subscription,
    isLoading,
    checkoutStatus,
    isReturning,
    dismissCheckout: dismiss,
  }
}
