import { useCallback } from 'react'
import { useSpaceSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { refreshSpaceEntitlements } from '@/services/entitlements/refreshSpaceEntitlements'
import { getSeatLimitMessage } from '../utils/seatLimitError'
import { useIsAdmin } from './useSpaceMembers'

/**
 * Adds a newly deployed Safe to the Workspace of the URL. Resolves to that Workspace, or to null
 * when the Safe stays outside it: none in the URL, signed out, not an admin, or refused.
 */
export const useAddNewSafeToUrlSpace = (): ((chainId: string, safeAddress: string) => Promise<string | null>) => {
  const dispatch = useAppDispatch()
  const isSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useUrlSpaceId()
  const isAdmin = useIsAdmin(spaceId ?? undefined)
  const [addSafeToSpace] = useSpaceSafesCreateV1Mutation()

  return useCallback(
    async (chainId: string, safeAddress: string) => {
      if (spaceId === null || !isSignedIn) return null

      if (!isAdmin) {
        dispatch(
          showNotification({
            message: 'Safe created in My accounts. Ask an admin to add it to the Workspace.',
            variant: 'info',
            groupKey: 'new-safe-space-skipped',
          }),
        )
        return null
      }

      const result = await addSafeToSpace({
        spaceId,
        createSpaceSafesDto: { safes: [{ chainId, address: safeAddress }] },
      })
      if (!result.error) return spaceId

      const seatLimit = getSeatLimitMessage(result.error)
      if (seatLimit) refreshSpaceEntitlements(dispatch, spaceId)
      dispatch(
        showNotification({
          message: `Safe created in My accounts, but not added to the Workspace. ${seatLimit ?? getRtkQueryErrorMessage(result.error)}`,
          variant: seatLimit ? 'info' : 'error',
          groupKey: 'new-safe-space-error',
        }),
      )
      return null
    },
    [spaceId, isSignedIn, isAdmin, addSafeToSpace, dispatch],
  )
}
