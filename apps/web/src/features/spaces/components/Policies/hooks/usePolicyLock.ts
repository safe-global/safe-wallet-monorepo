import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useSpaceEntitlements } from '../../../hooks/billing/useSpaceEntitlements'
import { useSpacePlan } from '../../../hooks/useSpacePlan'
import type { PolicyAccountCount, PolicyLock } from '../policyLock'

// Until the entitlements catalogue carries the policy engine key, the plan's name says whether it is included.
const PLAN_WITHOUT_POLICIES = 'Starter'

export type PolicyLockState = {
  /** The plan is still being read: neither today's page nor the banner shows yet. */
  isResolving: boolean
  lock?: Omit<PolicyLock, 'onUpgrade'>
}

/** Whether the workspace's plan gates the Policies page, and what the banner and tiles then say. Open while SAFE_PRO is off. */
export const usePolicyLock = (spaceId: string): PolicyLockState => {
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const { plan, tierName, seats, isLoading, isUninitialized } = useSpacePlan(spaceId)
  const { policyEngine } = useSpaceEntitlements(spaceId)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId }, { skip: !isSafePro })

  if (!isSafePro) return { isResolving: false }
  if (isLoading || isUninitialized) return { isResolving: true }
  if (!plan) return { isResolving: false }

  const planName = tierName ?? plan.name
  const includesPolicies = policyEngine ?? planName !== PLAN_WITHOUT_POLICIES
  if (includesPolicies) return { isResolving: false }

  const count: PolicyAccountCount = { applied: 0, total: seats?.used ?? 0 }

  return {
    isResolving: false,
    lock: {
      planName,
      workspaceName: space?.name ?? 'This Workspace',
      accountCounts: { 'spending-limit': count, proposer: count },
    },
  }
}
