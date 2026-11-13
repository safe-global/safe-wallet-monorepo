import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useCurrentSpaceId } from '@/features/spaces'
import type { TourStep } from '../types'

export const useRouteToStep = ({ route }: TourStep) => {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()

  useEffect(() => {
    if (router.pathname === route || !spaceId) return

    router.push({ pathname: route, query: { spaceId } })
  }, [router, spaceId, route])
}
