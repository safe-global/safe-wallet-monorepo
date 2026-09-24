import type { LinkProps } from 'next/link'
import { useHasFeature } from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSpaceEntitlements } from './billing/useSpaceEntitlements'
import { useCurrentSpaceId } from './useCurrentSpaceId'

/** The entitlement that unlocks creating proposers and spending limits. */
const POLICIES_ENTITLEMENT = 'policies'

export type PlanGate = {
  /** Show the Safe Pro upsell instead of the action. */
  isBlocked: boolean
  /** Neither the action nor the upsell may render yet. */
  isLoading: boolean
  /** The Workspace's plans, or Workspaces when there is none. */
  upgradeHref: LinkProps['href']
}

/**
 * Blocks the gated action while SAFE_PRO and its `gatingFlag` are both on and the active Workspace's plan does not
 * grant policies, whichever Safe is open. With either flag off nothing changes.
 */
export const usePlanGate = (gatingFlag: FEATURES): PlanGate => {
  const isSafeProEnabled = useHasFeature(FEATURES.SAFE_PRO) === true
  const isGatingFlagEnabled = useHasFeature(gatingFlag) === true
  const isGateActive = isSafeProEnabled && isGatingFlagEnabled
  const activeSpaceId = useCurrentSpaceId()
  const { isEntitled, isLoading: isEntitlementsLoading } = useSpaceEntitlements(isGateActive ? activeSpaceId : null)

  return {
    isBlocked: isGateActive && !isEntitlementsLoading && !isEntitled(POLICIES_ENTITLEMENT),
    isLoading: isGateActive && isEntitlementsLoading,
    upgradeHref: activeSpaceId
      ? { pathname: AppRoutes.spaces.plans, query: { spaceId: activeSpaceId } }
      : AppRoutes.welcome.spaces,
  }
}
