import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { TIERS, TRIAL_PLANS } from '../components/Plans/fixtures'
import type { PlansData } from '../components/Plans/types'

export const PLAN_STATUS_OVERRIDE_KEY = 'safeProPlanStatus'

// Fixture-backed until the entitlement endpoint lands; localStorage can force the status for QA.
export const useSpacePlan = (): { plan: PlansData['plan']; tierName?: string } => {
  const [status] = useLocalStorage<NonNullable<PlansData['plan']>['status']>(PLAN_STATUS_OVERRIDE_KEY)
  const plan = TRIAL_PLANS.plan && { ...TRIAL_PLANS.plan, status: status ?? TRIAL_PLANS.plan.status }

  return { plan, tierName: TIERS.find((tier) => tier.isCurrent)?.name }
}
