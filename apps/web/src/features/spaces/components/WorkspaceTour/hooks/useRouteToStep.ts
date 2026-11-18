import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useCurrentSpaceId } from '../../../public/hooks/useCurrentSpaceId'
import type { TourStep } from '../types'

export const useRouteToStep = ({ route }: TourStep): boolean => {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const isOnStepRoute = router.pathname === route
  const hasNavigated = useRef(false)

  useEffect(() => {
    if (isOnStepRoute || !spaceId || hasNavigated.current) return

    hasNavigated.current = true
    router.push({ pathname: route, query: { spaceId } })
  }, [router, spaceId, route, isOnStepRoute])

  return isOnStepRoute
}
