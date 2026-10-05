import { toPlanStatus } from './billing/subscription'
import { useIsAdmin } from './useSpaceMembers'
import { useSpacePlan } from './useSpacePlan'

/** The plan state Mixpanel stamps on every event inside a Workspace; null until the plan is known. */
export const useSpacePlanState = (spaceId: string | null) => {
  const { status, tierName, isLoading, isUninitialized } = useSpacePlan(spaceId)
  const isAdmin = useIsAdmin(spaceId ?? undefined)
  if (!spaceId || isLoading || isUninitialized) return null
  return { status: toPlanStatus(status), tier: tierName?.toLowerCase() ?? '', role: isAdmin ? 'admin' : 'member' }
}
