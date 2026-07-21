import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { closeByGroupKey, showNotification } from '@/store/notificationsSlice'
import { AppRoutes } from '@/config/routes'
import { filterSpacesByStatus } from '@/features/spaces/utils'
import { MemberStatus } from './useSpaceMembers'

// Key on expiry so a resend re-notifies
const inviteKey = (space: GetSpaceResponse, userId?: number): string => {
  const member = space.members.find((member) => member.user.id === userId)
  return `${space.uuid}:${member?.inviteExpiresAt ?? ''}`
}

export const useInviteNotification = (): void => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const notifiedInvites = useRef<Set<string>>(new Set())

  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })

  useEffect(() => {
    // The workspace list already renders the invite banner inline, so a toast
    // would just duplicate it. Skip here; navigating away surfaces the toast.
    if (router.pathname === AppRoutes.welcome.spaces) return

    const pendingInvites = filterSpacesByStatus(currentUser, spaces ?? [], MemberStatus.INVITED)
    const pendingKeys = new Set(pendingInvites.map((space) => inviteKey(space, currentUser?.id)))
    const pendingUuids = new Set(pendingInvites.map((space) => space.uuid))

    // Forget resolved invites and dismiss their now-stale toast once no longer INVITED
    for (const key of notifiedInvites.current) {
      if (pendingKeys.has(key)) continue
      notifiedInvites.current.delete(key)

      const uuid = key.slice(0, key.indexOf(':'))
      if (!pendingUuids.has(uuid)) {
        dispatch(closeByGroupKey({ groupKey: `space-invite-${uuid}` }))
      }
    }

    for (const space of pendingInvites) {
      const key = inviteKey(space, currentUser?.id)
      if (notifiedInvites.current.has(key)) continue

      notifiedInvites.current.add(key)
      dispatch(
        showNotification({
          variant: 'info',
          message: `You've been invited to join ${space.name}`,
          groupKey: `space-invite-${space.uuid}`,
          link: { href: AppRoutes.welcome.spaces, title: 'View invite' },
        }),
      )
    }
  }, [dispatch, currentUser, spaces, router.pathname])
}
