import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@/utils/addresses'
import { POLICY_GUARD } from '../config/constants'

/**
 * Checks that the user's Safe is enabled for policies
 * @returns {boolean} Whether the policies guard is enabled for the user's Safe
 */
const useIsPoliciesEnabled = () => {
  const { safe } = useSafeInfo()
  return sameAddress(safe.guard?.value, POLICY_GUARD)
}

export default useIsPoliciesEnabled
