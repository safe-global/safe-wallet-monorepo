import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useCurrentSpaceId } from '../useCurrentSpaceId'

/** The space the billing queries may run for, or null while they must stay skipped (flag off, signed out, no space). */
export const useBillingSpaceId = (spaceId?: string | null): string | null => {
  const currentSpaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isSafePro = useIsSafeProEnabled() === true
  const resolved = spaceId === undefined ? currentSpaceId : spaceId

  return isSafePro && isSignedIn && resolved ? resolved : null
}
