import type { PlansData } from '../components/Plans/types'
import { useSpaceEntitlements } from './billing/useSpaceEntitlements'
import { useSpaceSubscription } from './billing/useSpaceSubscription'

/** The Workspace's plan as the UI renders it: entitlements give the cycle and seats, the subscription the status. */
export const useSpacePlan = (spaceId?: string | null) => {
  const entitlements = useSpaceEntitlements(spaceId)
  const { subscription, status, isLoading: isSubscriptionLoading } = useSpaceSubscription(spaceId)

  const name = subscription?.plan.name ?? entitlements.plan?.name ?? undefined
  const plan: PlansData['plan'] =
    status === 'trialing' || status === 'active'
      ? { name: name ?? 'Safe Pro', status, periodEndsAt: entitlements.plan?.cycleEndsAt ?? null }
      : null

  return {
    plan,
    tierName: name,
    seats: entitlements.seats,
    subscription,
    status,
    isTrialing: status === 'trialing',
    isPaidActive: status === 'active',
    isLoading: entitlements.isLoading || isSubscriptionLoading,
  }
}
