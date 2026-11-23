import { useState } from 'react'
import { useRouter } from 'next/router'
import { useCurrentSpaceId } from '../../../public/hooks/useCurrentSpaceId'
import type { TourStep } from '../types'

const WELCOME_POSITION = -1

type Direction = 1 | -1

export const useTourNavigation = (steps: TourStep[]) => {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const [position, setPosition] = useState(WELCOME_POSITION)
  const [direction, setDirection] = useState<Direction>(1)

  const move = (delta: Direction) => {
    const nextPosition = Math.min(Math.max(position + delta, WELCOME_POSITION), steps.length)
    const nextStep = steps[nextPosition]
    setDirection(delta)
    setPosition(nextPosition)
    if (nextStep && router.pathname !== nextStep.route) {
      router.push({ pathname: nextStep.route, query: { spaceId } })
    }
  }

  return {
    step: steps[position],
    progress: { current: position + 1, total: steps.length },
    isWelcome: position === WELCOME_POSITION,
    isDone: position === steps.length,
    next: () => move(1),
    back: () => move(-1),
    skip: () => move(direction),
  }
}
