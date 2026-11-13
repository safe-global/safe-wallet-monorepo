import { useCallback } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useEntitlementsGetAllEntitlementsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { useSpaceSafesGetAllV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { hasSpacePlan, pickSafeWorkspace, type SafeWorkspacePick } from '@/utils/spaces'

/**
 * Returns a function that picks the Workspace of a Safe for the signed-in user. The function
 * returns undefined while the Workspace data loads, when disabled, or when the user is signed out.
 *
 * Lives in shared hooks (not the spaces feature) so shared code such as Safe links can use it
 * without importing the `@/features/spaces` barrel, which would form a circular dependency.
 */
export const useSafeWorkspacePicker = (
  enabled: boolean,
): ((chainId: string, address: string) => SafeWorkspacePick | undefined) => {
  const isSignedIn = useAppSelector(isAuthenticated)
  const isSafePro = useIsSafeProEnabled()
  const isActive = enabled && isSignedIn
  const { currentData: spacesSafes, isLoading: isSafesLoading } = useSpaceSafesGetAllV1Query(
    isActive ? undefined : skipToken,
  )
  const { currentData: entitlements, isLoading: isEntitlementsLoading } = useEntitlementsGetAllEntitlementsV1Query(
    isActive && isSafePro ? undefined : skipToken,
  )

  return useCallback(
    (chainId: string, address: string) => {
      if (!isActive || isSafesLoading || isEntitlementsLoading) return undefined

      const spaceIds = (spacesSafes ?? [])
        .filter(({ safes }) => (safes[chainId] ?? []).some((safeAddress) => sameAddress(safeAddress, address)))
        .map(({ spaceUuid }) => spaceUuid)
      return pickSafeWorkspace(spaceIds, (spaceId) => hasSpacePlan(isSafePro, entitlements?.[spaceId]))
    },
    [isActive, isSafesLoading, isEntitlementsLoading, spacesSafes, entitlements, isSafePro],
  )
}
