import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpaceSafesGetV1Query, useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import useChainId from '@/hooks/useChainId'
import { AppRoutes } from '@/config/routes'
import { useMemo } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useRouter } from 'next/router'

/**
 * Returns true if specific conditions apply such that
 * content can be displayed outside of space routes
 */
const useIsQualifiedSafe = () => {
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const { pathname } = useRouter()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn || !spaceId })
  const { currentData: safes } = useSpaceSafesGetV1Query(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn || !spaceId },
  )
  const safeAddress = useSafeAddressFromUrl()
  const chainId = useChainId()
  const isSpaceRoute = pathname.startsWith(AppRoutes.spaces.index) || pathname.startsWith(AppRoutes.welcome.spaces)

  const isSafePartOfSpace = useMemo(
    () => safes && Object.entries(safes.safes).some((safe) => safe[0] === chainId && safe[1].includes(safeAddress)),
    [chainId, safeAddress, safes],
  )

  return isUserSignedIn && !!spaceId && !isSpaceRoute && !!space && !!isSpacesFeatureEnabled && !!isSafePartOfSpace
}

export default useIsQualifiedSafe
