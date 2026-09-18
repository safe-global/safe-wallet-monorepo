import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { SAFE_ACCOUNTS_LIMIT } from '../constants'
import { useSpaceEntitlements } from './billing/useSpaceEntitlements'

/**
 * How many Safe accounts the Workspace may hold: the plan's seat quota under Safe Pro (`null` = unlimited),
 * the static cap otherwise or while the entitlements are still loading.
 */
export const useSpaceSafeLimit = (spaceId?: string | null): { limit: number | null; isLoading: boolean } => {
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const { seats, isLoading } = useSpaceEntitlements(spaceId)

  if (!isSafePro || !seats) return { limit: SAFE_ACCOUNTS_LIMIT, isLoading: isSafePro && isLoading }

  return { limit: seats.quota, isLoading: false }
}
