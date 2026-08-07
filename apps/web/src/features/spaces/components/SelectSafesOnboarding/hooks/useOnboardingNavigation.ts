import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import { setLastUsedSpace } from '@/store/authSlice'
import { AppRoutes } from '@/config/routes'
import { sanitizeNextUrl } from '@/utils/nextUrl'

const useOnboardingNavigation = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const spaceId = router.query.spaceId as string | undefined
  const next = sanitizeNextUrl(router.query.next) ?? undefined

  useEffect(() => {
    if (spaceId) {
      dispatch(setLastUsedSpace(spaceId))
    }
  }, [spaceId, dispatch])

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const handleBack = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.createSpace, query: { spaceId, ...(next ? { next } : {}) } })
  }, [router, spaceId, next])

  const handleSkip = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId, ...(next ? { next } : {}) } })
  }, [router, spaceId, next])

  const redirectToNextStep = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId, ...(next ? { next } : {}) } })
  }, [router, spaceId, next])

  return {
    spaceId,
    handleBack,
    handleSkip,
    redirectToNextStep,
  }
}

export default useOnboardingNavigation
