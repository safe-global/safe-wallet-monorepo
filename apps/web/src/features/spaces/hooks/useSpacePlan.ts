import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TIERS, TRIAL_PLANS } from '../components/Plans/fixtures'
import type { PlansData } from '../components/Plans/types'

export const PLAN_STATUS_OVERRIDE_KEY = 'safeProPlanStatus'

// TODO: fixture-backed until the entitlement endpoint lands; localStorage can force the status for QA.
export const useSpacePlan = (): {
  plan: PlansData['plan']
  tierName?: string
  isTrialing: boolean
  isPaidActive: boolean
} => {
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const [status] = useLocalStorage<NonNullable<PlansData['plan']>['status']>(PLAN_STATUS_OVERRIDE_KEY)
  const plan = TRIAL_PLANS.plan && { ...TRIAL_PLANS.plan, status: status ?? TRIAL_PLANS.plan.status }

  return {
    plan,
    tierName: TIERS.find((tier) => tier.isCurrent)?.name,
    isTrialing: isSafePro && plan?.status === 'trialing',
    isPaidActive: isSafePro && plan?.status === 'active',
  }
}
