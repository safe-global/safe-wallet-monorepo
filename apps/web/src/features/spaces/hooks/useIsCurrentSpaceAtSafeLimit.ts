import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isSpaceAtSafeLimit, normalizeSpaceId } from '@/utils/spaces'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useSpaceSafeLimit } from './useSpaceSafeLimit'

/**
 * Number of Safe accounts already in the given space, or undefined when there
 * is no space id or the count is unknown (e.g. spaces not yet loaded). Callers
 * that act on a specific space (e.g. the space POST target) must pass that same
 * id here rather than relying on the current-space resolution.
 */
export const useSpaceSafeCount = (spaceId: string | null): number | undefined => {
  const isSiweAuthenticated = useAppSelector(isAuthenticated)
  const { data: spaces } = useSpacesGetV1Query(undefined, { skip: !isSiweAuthenticated })

  const resolvedSpaceId = normalizeSpaceId(spaceId)
  if (resolvedSpaceId === null) return undefined

  return spaces?.find((s) => s.uuid === resolvedSpaceId)?.safeCount
}

/**
 * Number of Safe accounts already in the current space, or undefined when there
 * is no current space or the count is unknown (e.g. spaces not yet loaded).
 */
export const useCurrentSpaceSafeCount = (): number | undefined => {
  return useSpaceSafeCount(useCurrentSpaceId())
}

/** New Safes can still be created at the limit but won't be added to the space, so callers warn upfront. */
export const useIsCurrentSpaceAtSafeLimit = (): boolean => {
  const spaceId = useCurrentSpaceId()
  const safeCount = useSpaceSafeCount(spaceId)
  const { limit } = useSpaceSafeLimit(spaceId)
  return isSpaceAtSafeLimit(safeCount, limit)
}
