import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useCurrentSpaceId } from '@/features/spaces'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { selectLastUsedSpaceOrigin } from '@/features/spaces/store'
import { AppRoutes } from '@/config/routes'

export function useSpaceBackLink() {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isUserSignedIn || !spaceId })
  const origin = useAppSelector(selectLastUsedSpaceOrigin)
  const router = useRouter()

  const handleBackToSpace = useCallback(() => {
    if (spaceId) {
      // Return to the space sub-page the user came from (e.g. the Security Hub), but only when that
      // origin belongs to the space we're currently in — otherwise a stale origin from another
      // workspace would misroute "back". Fall back to the workspace landing in every other case
      // (different space, or no origin recorded on a deep-link / fresh session).
      const pathname = origin?.spaceId === spaceId ? origin.path : AppRoutes.spaces.index
      router.push({
        pathname,
        query: { spaceId },
      })
    }
  }, [spaceId, origin, router])

  return { space, handleBackToSpace }
}
