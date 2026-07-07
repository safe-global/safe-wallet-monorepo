import { useEffect, useRef } from 'react'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { AppRoutes } from '@/config/routes'
import { filterSpacesByStatus } from '@/features/spaces/utils'
import { MemberStatus } from '@/features/spaces/hooks/useSpaceMembers'

export const useInviteNotification = (): void => {
  const dispatch = useAppDispatch()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const notifiedUuids = useRef<Set<string>>(new Set())

  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })

  useEffect(() => {
    const pendingInvites = filterSpacesByStatus(currentUser, spaces ?? [], MemberStatus.INVITED)
    const pendingUuids = new Set(pendingInvites.map((space) => space.uuid))

    // Drop resolved invites so a future re-invite notifies again
    for (const uuid of notifiedUuids.current) {
      if (!pendingUuids.has(uuid)) {
        notifiedUuids.current.delete(uuid)
      }
    }

    for (const space of pendingInvites) {
      if (notifiedUuids.current.has(space.uuid)) continue

      notifiedUuids.current.add(space.uuid)
      dispatch(
        showNotification({
          variant: 'info',
          message: `You've been invited to join ${space.name}`,
          groupKey: `space-invite-${space.uuid}`,
          link: { href: AppRoutes.welcome.spaces, title: 'View invite' },
        }),
      )
    }
  }, [dispatch, currentUser, spaces])
}
