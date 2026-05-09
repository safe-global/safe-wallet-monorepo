import useSafeInfo from './useSafeInfo'
import useChainId from './useChainId'
import { useSafeAddressFromUrl } from './useSafeAddressFromUrl'

/**
 * Returns the effective chainId and safeAddress for data fetching.
 * Uses URL-derived values as immediate fallback before safe info arrives from Redux,
 * enabling parallel API requests on initial page load without waiting for safe info.
 */
const useEffectiveSafeParams = (): { effectiveAddress: string; effectiveChainId: string } => {
  const { safe, safeAddress } = useSafeInfo()
  const safeAddressFromUrl = useSafeAddressFromUrl()
  const chainId = useChainId()

  return {
    effectiveAddress: safeAddress || safeAddressFromUrl,
    effectiveChainId: safe.chainId || chainId,
  }
}

export default useEffectiveSafeParams
