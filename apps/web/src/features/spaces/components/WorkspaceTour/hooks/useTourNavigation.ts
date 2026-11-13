import { useCallback, useState } from 'react'
import type { TourStep } from '../types'

const WELCOME_POSITION = -1

type Direction = 1 | -1

export const useTourNavigation = (steps: TourStep[]) => {
  const [position, setPosition] = useState(WELCOME_POSITION)
  const [direction, setDirection] = useState<Direction>(1)

  const move = useCallback(
    (delta: Direction) => {
      setDirection(delta)
      setPosition((current) => Math.min(Math.max(current + delta, WELCOME_POSITION), steps.length))
    },
    [steps.length],
  )

  const next = useCallback(() => move(1), [move])
  const back = useCallback(() => move(-1), [move])
  const skip = useCallback(() => move(direction), [move, direction])

  return {
    step: steps[position],
    progress: { current: position + 1, total: steps.length },
    isWelcome: position === WELCOME_POSITION,
    isDone: position === steps.length,
    next,
    back,
    skip,
  }
}
