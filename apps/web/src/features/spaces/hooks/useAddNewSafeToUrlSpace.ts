import { useCallback } from 'react'
import { useSpaceSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { stepUpReturnUrlCleared, stepUpReturnUrlSet } from '@/features/oidc-auth/store'
import { refreshSpaceEntitlements } from '@/services/entitlements/refreshSpaceEntitlements'
import { getSeatLimitMessage } from '../utils/seatLimitError'
import { useIsAdmin } from './useSpaceMembers'

export type AddNewSafeToSpaceResult = {
  /** Null when the Safe stays outside the Workspace: none in the URL, signed out, not an admin, or refused. */
  spaceId: string | null
  /** The browser is leaving for the step-up, and its replay adds the Safe. */
  isStepUpPending: boolean
}

/** Adds a newly deployed Safe to the Workspace of the URL; a step-up returns to `getStepUpReturnUrl(spaceId)`. */
export const useAddNewSafeToUrlSpace = (): ((
  chainId: string,
  safeAddress: string,
  getStepUpReturnUrl: (spaceId: string) => string,
) => Promise<AddNewSafeToSpaceResult>) => {
  const dispatch = useAppDispatch()
  const isSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useUrlSpaceId()
  const isAdmin = useIsAdmin(spaceId ?? undefined)
  const [addSafeToSpace] = useSpaceSafesCreateV1Mutation()

  return useCallback(
    async (chainId: string, safeAddress: string, getStepUpReturnUrl: (spaceId: string) => string) => {
      const outside: AddNewSafeToSpaceResult = { spaceId: null, isStepUpPending: false }
      if (spaceId === null || !isSignedIn) return outside

      if (!isAdmin) {
        dispatch(
          showNotification({
            message: 'Safe created in My accounts. Ask an admin to add it to the Workspace.',
            variant: 'info',
            groupKey: 'new-safe-space-skipped',
          }),
        )
        return outside
      }

      const stepUpReturnUrl = getStepUpReturnUrl(spaceId)
      dispatch(stepUpReturnUrlSet(stepUpReturnUrl))
      const result = await addSafeToSpace({
        spaceId,
        createSpaceSafesDto: { safes: [{ chainId, address: safeAddress }] },
      })
      if (isElevationRequiredError(result.error)) return { spaceId: null, isStepUpPending: true }

      dispatch(stepUpReturnUrlCleared(stepUpReturnUrl))
      if (!result.error) return { spaceId, isStepUpPending: false }

      const seatLimit = getSeatLimitMessage(result.error)
      if (seatLimit) refreshSpaceEntitlements(dispatch, spaceId)
      dispatch(
        showNotification({
          message: `Safe created in My accounts, but not added to the Workspace. ${seatLimit ?? getRtkQueryErrorMessage(result.error)}`,
          variant: seatLimit ? 'info' : 'error',
          groupKey: 'new-safe-space-error',
        }),
      )
      return outside
    },
    [spaceId, isSignedIn, isAdmin, addSafeToSpace, dispatch],
  )
}
