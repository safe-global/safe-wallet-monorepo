import { useEffect } from 'react'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { localItem } from '@/services/local-storage/local'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

export const WORKSPACE_TOUR_SEEN_KEY = 'workspaceTourSeen'

export const getWorkspaceTourSeenKey = (userId: number) => `${WORKSPACE_TOUR_SEEN_KEY}_${userId}`

type WorkspaceTourVisit = {
  canShowTour: boolean
  /** On screen, not only open: a dialog on top holds the open tour back. */
  isShown: boolean
  onFirstVisit: () => void
}

export const useWorkspaceTourVisit = ({ canShowTour, isShown, onFirstVisit }: WorkspaceTourVisit) => {
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isSignedIn })
  const userId = user?.id

  useEffect(() => {
    if (!canShowTour || userId === undefined) return
    if (!localItem<boolean>(getWorkspaceTourSeenKey(userId)).get()) onFirstVisit()
  }, [canShowTour, userId, onFirstVisit])

  // Marked once shown, not on finish: leaving mid-tour counts as having seen it.
  useEffect(() => {
    if (isShown && userId !== undefined) localItem<boolean>(getWorkspaceTourSeenKey(userId)).set(true)
  }, [isShown, userId])
}
