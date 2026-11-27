import { useCallback, useEffect } from 'react'
import { localItem } from '@/services/local-storage/local'

export const WORKSPACE_TOUR_SEEN_KEY = 'workspaceTourSeen'

const tourSeen = localItem<boolean>(WORKSPACE_TOUR_SEEN_KEY)

/** Opens the tour on the first visit in this browser; `markSeen` records the visit once the tour is on screen. */
export const useWorkspaceTourVisit = (canShowTour: boolean, onFirstVisit: () => void) => {
  useEffect(() => {
    if (canShowTour && !tourSeen.get()) onFirstVisit()
  }, [canShowTour, onFirstVisit])

  // Marked once shown, not on finish: leaving mid-tour counts as having seen it.
  const markSeen = useCallback(() => tourSeen.set(true), [])

  return { markSeen }
}
