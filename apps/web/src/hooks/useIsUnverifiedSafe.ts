import { useMemo } from 'react'
import useSafeInfo from './useSafeInfo'
import useChainId from './useChainId'
import { useSafeAddressFromUrl } from './useSafeAddressFromUrl'

/**
 * Check if the current Safe was loaded from fallback (URL only, not deployed/indexed)
 * Returns true when Safe info has minimal data (address + chainId only)
 */
const useIsUnverifiedSafe = (): boolean => {
  const { safe } = useSafeInfo()
  const chainId = useChainId()
  const addressFromUrl = useSafeAddressFromUrl()

  return useMemo(() => {
    // Safe is unverified if it has no owners (sign of fallback construction)
    // AND it matches the URL parameters
    return (
      safe.owners.length === 0 &&
      safe.address.value === addressFromUrl &&
      safe.chainId === chainId &&
      safe.deployed === false
    )
  }, [safe, chainId, addressFromUrl])
}

export default useIsUnverifiedSafe
