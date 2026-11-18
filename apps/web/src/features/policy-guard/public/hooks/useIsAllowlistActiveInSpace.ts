import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useHasFeature } from '@/hooks/useChains'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isAllowlistOptedIn } from '../services/allowlistAvailability'
import { useIsAllowlistAvailableInSpace } from './useAllowlistAvailability'

/** `undefined` while the chain config or the space is still loading, so callers can avoid flicker. */
export const useIsAllowlistActiveInSpace = (spaceId?: string): boolean | undefined => {
  const hasExperimentalFlag = useHasFeature(FEATURES.WORKSPACES_EXPERIMENTAL_FEATURES)
  const isAvailable = useIsAllowlistAvailableInSpace()
  const urlSpaceId = useUrlSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const id = spaceId ?? urlSpaceId ?? ''
  const { currentData: space, isFetching } = useSpacesGetOneV1Query(
    { id },
    { skip: !isSignedIn || !id || hasExperimentalFlag === false },
  )

  if (hasExperimentalFlag === undefined || (isFetching && space === undefined)) return undefined

  return hasExperimentalFlag && isAvailable && isAllowlistOptedIn(space)
}
