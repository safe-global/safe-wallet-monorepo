import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { parseNextUrlForRouter, sanitizeNextUrl } from '@/utils/nextUrl'

const useInviteNavigation = () => {
  const router = useRouter()
  const spaceId = router.query.spaceId as string | undefined
  const nextString = sanitizeNextUrl(router.query.next)
  const nextUrl = parseNextUrlForRouter(router.query.next)

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const goBack = useCallback(() => {
    router.push({
      pathname: AppRoutes.welcome.selectSafes,
      query: { spaceId, ...(nextString ? { next: nextString } : {}) },
    })
  }, [router, spaceId, nextString])

  const redirectToNextStep = useCallback(() => {
    if (nextUrl) {
      router.push(nextUrl)
      return
    }
    router.push({ pathname: AppRoutes.welcome.survey, query: { spaceId } })
  }, [router, spaceId, nextUrl])

  return {
    spaceId,
    goBack,
    redirectToNextStep,
  }
}

export default useInviteNavigation
