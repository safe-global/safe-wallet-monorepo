import { getSupportIdentityKey } from '../utils/supportIdentity'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { GATEWAY_URL } from '@/config/gateway'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSupportSession } from './useSupportSession'

/** Read the same CGW decision used to select the widget; never infer it from a route or plan label. */
export function useSupportEligibility(enabled: boolean): boolean {
  const signedIn = useAppSelector(isAuthenticated)
  const { currentData: user, isError } = useAuthGetMeV1Query(undefined, {
    skip: !enabled || !signedIn,
  })
  const identityKey = signedIn && !isError ? getSupportIdentityKey(user) : undefined
  const { session, error } = useSupportSession(GATEWAY_URL, enabled, identityKey, { autoRefresh: false })

  return Boolean(enabled && identityKey && !error && session?.supportEligible)
}
