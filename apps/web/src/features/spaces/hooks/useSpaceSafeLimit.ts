import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SafeLimit } from '@/utils/spaces'
import { SAFE_ACCOUNTS_LIMIT } from '../constants'
import { useSpaceEntitlements } from './billing/useSpaceEntitlements'

type SpaceSafeLimit = { limit: SafeLimit; isLoading: boolean; isError: boolean; retry: () => void }

/**
 * How many Safe accounts the Workspace may hold: under Safe Pro only the entitlements' seats meter decides, and the
 * limit is `undefined` until it arrives, so a load or a failure never reads as a quota. Without Safe Pro, the static cap.
 */
export const useSpaceSafeLimit = (spaceId?: string | null): SpaceSafeLimit => {
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const { seats, isLoading, isError, refetch } = useSpaceEntitlements(spaceId)

  if (!isSafePro) return { limit: SAFE_ACCOUNTS_LIMIT, isLoading: false, isError: false, retry: refetch }

  return { limit: seats ? seats.quota : undefined, isLoading, isError, retry: refetch }
}
