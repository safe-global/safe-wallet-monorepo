import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/**
 * Hook to check if the current safe is pinned (in the user's trusted list)
 *
 * @returns true if the current safe is pinned, false otherwise
 */
const useIsPinnedSafe = (): boolean => {
  const { safe, safeAddress } = useSafeInfo()
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const chainId = safe?.chainId

  if (!chainId || !safeAddress) return false

  // Use case-insensitive comparison to handle addresses with different casing
  const chainSafes = addedSafes[chainId]
  if (!chainSafes) return false

  return Object.keys(chainSafes).some((addr) => sameAddress(addr, safeAddress))
}

export default useIsPinnedSafe
