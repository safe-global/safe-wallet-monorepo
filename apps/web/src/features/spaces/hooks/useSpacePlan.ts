import type { PlanSummary } from '../components/Plans/types'
import {
  getDaysLeft,
  getSubscriptionPeriodEnd,
  getSubscriptionPlanName,
  TRIAL_ENDING_SOON_DAYS,
} from './billing/subscription'
import { useSpaceEntitlements } from './billing/useSpaceEntitlements'
import { useSpaceSubscription } from './billing/useSpaceSubscription'

/** The Workspace's plan as the UI renders it: entitlements give the cycle and seats, the subscription the status. */
export const useSpacePlan = (spaceId?: string | null) => {
  const entitlements = useSpaceEntitlements(spaceId)
  const {
    subscription,
    latestSubscription,
    status,
    hasPaymentMethod,
    isLoading: isSubscriptionLoading,
    isUninitialized: isSubscriptionUninitialized,
    isError: isSubscriptionError,
    refetch: refetchSubscription,
  } = useSpaceSubscription(spaceId)

  // Entitlements may lag the webhook right after checkout, so the subscription itself backs both values.
  const name = getSubscriptionPlanName(subscription) ?? entitlements.plan?.name ?? undefined
  const periodEndsAt = entitlements.plan?.cycleEndsAt ?? getSubscriptionPeriodEnd(subscription)
  const daysLeft = getDaysLeft(periodEndsAt)
  const plan: PlanSummary | null =
    status === 'trialing' || status === 'active'
      ? { name: name ?? 'Safe Pro', status, periodEndsAt, daysLeft, hasPaymentMethod }
      : null
  const isTrialing = status === 'trialing'

  return {
    plan,
    tierName: name,
    seats: entitlements.seats,
    sponsoredTxs: entitlements.sponsoredTxs,
    subscription,
    latestSubscription,
    status,
    isTrialing,
    hasPaymentMethod,
    isTrialEndingSoon: isTrialing && daysLeft !== null && daysLeft <= TRIAL_ENDING_SOON_DAYS,
    isPaidActive: status === 'active',
    isLoading: entitlements.isLoading || isSubscriptionLoading,
    /** True until both queries have started (skipped or not yet dispatched), when `status` still reads `none`. */
    isUninitialized: Boolean(entitlements.isUninitialized || isSubscriptionUninitialized),
    /** A source failed for good (rate-limit retries exhausted included); `status` then reads `none` and cannot be trusted. */
    isError: entitlements.isError || isSubscriptionError,
    refetch: () => {
      void entitlements.refetch()
      void refetchSubscription()
    },
  }
}
