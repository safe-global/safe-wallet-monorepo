import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useCurrentSpaceId } from '@/features/spaces'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { selectLastUsedSpacePath } from '@/features/spaces/store'
import { AppRoutes } from '@/config/routes'

export function useSpaceBackLink() {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isUserSignedIn || !spaceId })
  const originPath = useAppSelector(selectLastUsedSpacePath)
  const router = useRouter()

  const handleBackToSpace = useCallback(() => {
    if (spaceId) {
      // Return to the space sub-page the user came from (e.g. the Security Hub), falling back
      // to the workspace landing when no origin was recorded (deep-link / fresh session).
      router.push({
        pathname: originPath ?? AppRoutes.spaces.index,
        query: { spaceId },
      })
    }
  }, [spaceId, originPath, router])

  return { space, handleBackToSpace }
}
