import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated, lastUsedSpace, setLastUsedSpace } from '@/store/authSlice'
import { useLazySpacesGetV1Query, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export const useSignInRedirect = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const currentSpaceId = useAppSelector(lastUsedSpace)
  const isSiweAuthenticated = useAppSelector(isAuthenticated)

  // Reactive query for template UI (skipped until authenticated)
  const { data: spaces } = useSpacesGetV1Query(undefined, { skip: !isSiweAuthenticated })

  // Lazy query to fetch fresh spaces data at redirect time
  const [triggerSpacesQuery] = useLazySpacesGetV1Query()

  const redirect = useCallback(async () => {
    // Fetch spaces fresh – auth cookie is now set after SIWE
    const { data: spaces } = await triggerSpacesQuery()
    const hasSpaces = spaces && spaces.length > 0

    if (!hasSpaces) {
      router.push({ pathname: AppRoutes.onboarding.createSpace, query: router.query })
      return
    }

    // Use last used space if the user is still a member, otherwise fall back to the first space
    const isInLastUsedSpace = spaces.some((space) => String(space.id) === currentSpaceId)
    const targetSpaceId = isInLastUsedSpace && currentSpaceId ? currentSpaceId : String(spaces[0].id)

    if (!isInLastUsedSpace || !currentSpaceId) {
      dispatch(setLastUsedSpace(targetSpaceId))
    }

    router.push({ pathname: AppRoutes.spaces.index, query: { ...router.query, spaceId: targetSpaceId } })
  }, [triggerSpacesQuery, currentSpaceId, dispatch, router])

  return { redirect, spaces }
}
