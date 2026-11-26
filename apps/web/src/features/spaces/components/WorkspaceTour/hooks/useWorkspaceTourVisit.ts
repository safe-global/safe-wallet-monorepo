import { useCallback, useEffect } from 'react'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { localItem } from '@/services/local-storage/local'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

export const WORKSPACE_TOUR_SEEN_KEY = 'workspaceTourSeen'

export const getWorkspaceTourSeenKey = (userId: number) => `${WORKSPACE_TOUR_SEEN_KEY}_${userId}`

/** Opens the tour on a member's first visit; `markSeen` records the visit once the tour is on screen. */
export const useWorkspaceTourVisit = (canShowTour: boolean, onFirstVisit: () => void) => {
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isSignedIn })
  const userId = user?.id

  useEffect(() => {
    if (!canShowTour || userId === undefined) return
    if (!localItem<boolean>(getWorkspaceTourSeenKey(userId)).get()) onFirstVisit()
  }, [canShowTour, userId, onFirstVisit])

  // Marked once shown, not on finish: leaving mid-tour counts as having seen it.
  const markSeen = useCallback(() => {
    if (userId !== undefined) localItem<boolean>(getWorkspaceTourSeenKey(userId)).set(true)
  }, [userId])

  return { markSeen }
}
