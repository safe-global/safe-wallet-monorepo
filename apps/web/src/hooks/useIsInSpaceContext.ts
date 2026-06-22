import { useIsQualifiedSafe } from '@/features/spaces'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

/**
 * True when the UI is in a space (workspace) context: either viewing a Safe that
 * qualifies for the current space, or on any /spaces route. Single source of truth
 * shared by useSafeBarSafes and the rename flow.
 */
export const useIsInSpaceContext = (): boolean => {
  const isQualifiedSafe = useIsQualifiedSafe()
  const isSpaceRoute = useIsSpaceRoute()
  return isQualifiedSafe || isSpaceRoute
}
