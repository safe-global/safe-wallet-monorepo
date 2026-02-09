import { useAppSelector } from '@/store'
import { selectIsCuratedNestedSafe } from '@/store/settingsSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsPinnedSafe from '@/hooks/useIsPinnedSafe'

/**
 * Hook to check if the current safe is trusted.
 * A safe is trusted if either:
 * 1. Pinned (explicitly added to addedSafes by the user)
 * 2. Curated as a nested safe under any parent safe
 *
 * @returns true if the current safe is trusted, false otherwise
 */
const useIsTrustedSafe = (): boolean => {
  const isPinned = useIsPinnedSafe()
  const { safeAddress } = useSafeInfo()
  const isCurated = useAppSelector((state) => (safeAddress ? selectIsCuratedNestedSafe(state, safeAddress) : false))

  return isPinned || isCurated
}

export default useIsTrustedSafe
