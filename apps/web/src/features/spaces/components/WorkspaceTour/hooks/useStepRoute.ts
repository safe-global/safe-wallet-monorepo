import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import type { TourStep } from '../types'

export const useStepRoute = ({ route }: TourStep, onLeave: () => void): boolean => {
  const { pathname } = useRouter()
  const isOnStepRoute = pathname === route
  const [hasArrived, setHasArrived] = useState(isOnStepRoute)

  if (isOnStepRoute && !hasArrived) setHasArrived(true)

  useEffect(() => {
    if (hasArrived && !isOnStepRoute) onLeave()
  }, [hasArrived, isOnStepRoute, onLeave])

  return isOnStepRoute
}
