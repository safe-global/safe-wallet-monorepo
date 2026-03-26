import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import { setLastUsedSpace } from '@/store/authSlice'
import { AppRoutes } from '@/config/routes'

const useOnboardingNavigation = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const spaceId = router.query.spaceId as string | undefined

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
    router.push({ pathname: AppRoutes.welcome.createSpace, query: { spaceId } })
  }, [router, spaceId])

  const handleSkip = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId } })
  }, [router, spaceId])

  const redirectToNextStep = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId } })
  }, [router, spaceId])

  return {
    spaceId,
    handleBack,
    handleSkip,
    redirectToNextStep,
  }
}

export default useOnboardingNavigation
