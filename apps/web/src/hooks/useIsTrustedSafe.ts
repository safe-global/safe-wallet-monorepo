import { useAppSelector } from '@/store'
import { selectIsCuratedNestedSafe } from '@/store/settingsSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsPinnedSafe from '@/hooks/useIsPinnedSafe'
import { useIsSafeInCurrentSpace } from '@/features/spaces'

/**
 * Hook to check if the current safe is trusted.
 * A safe is trusted if either:
 * 1. Pinned (explicitly added to addedSafes by the user)
 * 2. Curated as a nested safe under any parent safe
 * 3. In the Workspace of the URL
 *
 * @returns true if the current safe is trusted, false otherwise
 */
const useIsTrustedSafe = (): boolean => {
  const isPinned = useIsPinnedSafe()
  const { safe, safeAddress } = useSafeInfo()
  const isCurated = useAppSelector((state) => (safeAddress ? selectIsCuratedNestedSafe(state, safeAddress) : false))
  const isInCurrentSpace = useIsSafeInCurrentSpace(safe.chainId, safeAddress)

  return isPinned || isCurated || isInCurrentSpace
}

export default useIsTrustedSafe
