import { useEffect } from 'react'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { localItem } from '@/services/local-storage/local'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

export const WORKSPACE_TOUR_SEEN_KEY = 'workspaceTourSeen'

export const getWorkspaceTourSeenKey = (userId: number) => `${WORKSPACE_TOUR_SEEN_KEY}_${userId}`

export const useWorkspaceTourVisit = (canShowTour: boolean, onFirstVisit: () => void) => {
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isSignedIn })
  const userId = user?.id

  useEffect(() => {
    if (!canShowTour || userId === undefined) {
      return
    }

    const seen = localItem<boolean>(getWorkspaceTourSeenKey(userId))
    if (seen.get()) {
      return
    }

    // Marked on open, not on finish: leaving mid-tour counts as having seen it.
    seen.set(true)
    onFirstVisit()
  }, [canShowTour, userId, onFirstVisit])
}
