import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'

const useInviteNavigation = () => {
  const router = useRouter()
  const spaceId = router.query.spaceId as string | undefined

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const goBack = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.selectSafes, query: { spaceId } })
  }, [router, spaceId])

  const redirectToNextStep = useCallback(() => {
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }, [router, spaceId])

  return {
    spaceId,
    goBack,
    redirectToNextStep,
  }
}

export default useInviteNavigation
