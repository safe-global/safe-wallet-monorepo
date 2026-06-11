import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { normalizeSpaceId } from '@/utils/spaces'
import { SAFE_ACCOUNTS_LIMIT } from '@/features/spaces/components/Sidebar/constants'
import { useCurrentSpaceId } from './useCurrentSpaceId'

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

/**
 * Whether the current space already holds the maximum number of Safe accounts
 * (`SAFE_ACCOUNTS_LIMIT`). New Safes can still be created, but they won't be
 * added to a space that is at the limit, so callers can warn the user upfront.
 *
 * Returns false when there is no current space or the count is unknown.
 */
export const useIsCurrentSpaceAtSafeLimit = (): boolean => {
  const safeCount = useCurrentSpaceSafeCount()
  return safeCount !== undefined && safeCount >= SAFE_ACCOUNTS_LIMIT
}
