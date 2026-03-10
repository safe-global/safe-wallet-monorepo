import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useCurrentSpaceId } from '@/features/spaces'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { AppRoutes } from '@/config/routes'

export function useSpaceBackLink() {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn || !spaceId })
  const router = useRouter()

  const handleBackToSpace = useCallback(() => {
    if (spaceId) {
      router.push({
        pathname: AppRoutes.spaces.index,
        query: { spaceId },
      })
    }
  }, [spaceId, router])

  return { space, handleBackToSpace }
}
