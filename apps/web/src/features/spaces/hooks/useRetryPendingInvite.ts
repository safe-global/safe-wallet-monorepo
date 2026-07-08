import { useEffect, useRef } from 'react'
import { useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

export const PENDING_INVITE_KEY = 'SAFE_pendingSpaceInvite'

export type PendingInvite = {
  spaceId: string
  users: Array<{ address: string; role: string; name?: string; alias?: string }>
  label: string
}

/**
 * Completes a member invite that was interrupted by a step-up authentication
 * redirect. AddMemberModal stores the payload in sessionStorage before
 * redirecting; when the user lands back on the members page with an elevated
 * session, this hook fires the invite automatically.
 */
export function useRetryPendingInvite(): void {
  const [inviteMembers] = useMembersInviteUserV1Mutation()
  const dispatch = useAppDispatch()
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return

    const raw = sessionStorage.getItem(PENDING_INVITE_KEY)
    if (!raw) return

    attempted.current = true
    // Removed before the attempt so a failure can never cause a retry loop
    sessionStorage.removeItem(PENDING_INVITE_KEY)

    let pending: PendingInvite
    try {
      pending = JSON.parse(raw)
    } catch {
      return
    }

    inviteMembers({
      spaceId: pending.spaceId,
      inviteUsersDto: { users: pending.users as never },
    }).then((response) => {
      if (response.data) {
        dispatch(
          showNotification({
            message: `Invited ${pending.label} to space`,
            variant: 'success',
            groupKey: 'invite-member-success',
          }),
        )
      } else {
        dispatch(
          showNotification({
            message: getRtkQueryErrorMessage(response.error) || 'Invite failed. Please try again.',
            variant: 'error',
            groupKey: 'invite-member-retry-failed',
          }),
        )
      }
    })
  }, [inviteMembers, dispatch])
}
