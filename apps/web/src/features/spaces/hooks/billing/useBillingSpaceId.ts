import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useCurrentSpaceId } from '../useCurrentSpaceId'

/** The space the billing queries may run for, or null while they must stay skipped (flag off, signed out, no space). */
export const useBillingSpaceId = (spaceId?: string | null): string | null => {
  const currentSpaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const resolved = spaceId === undefined ? currentSpaceId : spaceId

  return isSafePro && isSignedIn && resolved ? resolved : null
}
