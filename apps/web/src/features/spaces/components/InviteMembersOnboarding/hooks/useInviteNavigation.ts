import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { sanitizeNextUrl } from '@/utils/nextUrl'

const useInviteNavigation = () => {
  const router = useRouter()
  const spaceId = router.query.spaceId as string | undefined
  const next = sanitizeNextUrl(router.query.next)

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const goBack = useCallback(() => {
    router.push({
      pathname: AppRoutes.welcome.selectSafes,
      query: { spaceId, ...(next ? { next } : {}) },
    })
  }, [router, spaceId, next])

  const redirectToNextStep = useCallback(() => {
    if (next) {
      router.push(next)
      return
    }
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }, [router, spaceId, next])

  return {
    spaceId,
    goBack,
    redirectToNextStep,
  }
}

export default useInviteNavigation
